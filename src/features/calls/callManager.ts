import type {CallAudio} from './callAudio';
import {CALL_MESSAGES, CallRole, getEndMessage} from './callMessages';
import {
  CallRequestError,
  MicrophonePermissionError,
  NETWORK_ERROR_CODE,
} from './callErrors';
import type {
  CallPeerHandlers,
  CallPeerLike,
  PeerConnectionStatus,
} from './callPeer';
import type {CallSignalingClient} from './callSignaling';
import type {
  CallAcceptedEvent,
  PeerInfo,
  CallEndedEvent,
  CallResumeEvent,
  CallSignalEvent,
  IceServer,
  IncomingCallEvent,
  SignalKind,
  SignalPayload,
} from './callTypes';

/** Сколько показывается экран «Звонок завершён» перед возвратом в idle */
export const ENDED_SCREEN_MS = 2000;

export type CallState =
  | {phase: 'idle'}
  | {phase: 'outgoing'; orderId: string; peerName: string}
  | {phase: 'incoming'; orderId: string; peerName: string}
  | {phase: 'connecting'; orderId: string; peerName: string}
  | {
      phase: 'active';
      orderId: string;
      peerName: string;
      connectedAt: number;
      isReconnecting: boolean;
    }
  | {phase: 'ended'; peerName: string; message: string};

/**
 * Системный интерфейс звонка: CallKit (iOS) или уведомление о входящем (Android).
 * Менеджер сообщает ему о входящих и завершённых звонках; обратные события
 * («ответить»/«сбросить» с системного экрана) приходят в answerFromSystem / endFromSystem.
 */
export interface SystemCallUi {
  /** true — входящий показывает система (CallKit): свой экран и рингтон не нужны, аудиосессией управляет система */
  readonly showsIncomingUi: boolean;
  reportIncoming(call: {
    callId: string;
    orderId: string;
    callerName: string;
  }): void;
  reportEnded(callId: string): void;
}

const NOOP_SYSTEM_UI: SystemCallUi = {
  showsIncomingUi: false,
  reportIncoming: () => {},
  reportEnded: () => {},
};

/** Входящий, о котором приложение узнало из пуша (возможно, до подключения сокета) */
export interface PushedIncomingCall extends IncomingCallEvent {
  /** Момент (ms), после которого звонок на сервере уже завершён по таймауту */
  expiresAt?: number;
}

export interface CallSnapshot {
  call: CallState;
  isMuted: boolean;
  isSpeakerOn: boolean;
}

export interface CallManagerDeps {
  getToken: () => Promise<string | null>;
  createSignaling: (token: string) => CallSignalingClient;
  fetchIceServers: () => Promise<IceServer[]>;
  createPeer: (
    iceServers: IceServer[],
    handlers: CallPeerHandlers,
  ) => Promise<CallPeerLike>;
  audio: CallAudio;
  /** Кого показать, если о звонке известно только из call:resume (имени в событии нет) */
  fallbackCaller: PeerInfo;
  systemUi?: SystemCallUi;
  now?: () => number;
  schedule?: (fn: () => void, ms: number) => unknown;
  cancelSchedule?: (handle: unknown) => void;
  logError?: (message: string, error: unknown) => void;
}

/**
 * Одна попытка звонка. После закрытия сессии результаты «опоздавших» await
 * (ice-servers, микрофон, invite) игнорируются — так решаются гонки с кнопкой «Завершить».
 */
interface Session {
  orderId: string;
  peerName: string;
  role: CallRole;
  callId: string | null;
  peer: CallPeerLike | null;
  isClosed: boolean;
}

const IDLE_SNAPSHOT: CallSnapshot = {
  call: {phase: 'idle'},
  isMuted: false,
  isSpeakerOn: false,
};

const toUserMessage = (error: unknown): string => {
  if (
    error instanceof CallRequestError ||
    error instanceof MicrophonePermissionError
  ) {
    return error.message;
  }
  return CALL_MESSAGES.genericFailure;
};

/**
 * Оркестратор звонка: сокет-сигналинг + WebRTC + аудио. Без зависимостей от React:
 * UI подписывается через subscribe/getSnapshot (useSyncExternalStore).
 */
export class CallManager {
  private snapshot: CallSnapshot = IDLE_SNAPSHOT;
  private readonly listeners = new Set<() => void>();
  private signaling: CallSignalingClient | null = null;
  private connecting: Promise<void> | null = null;
  /** Увеличивается при disconnect, чтобы отменить подключение, начатое до выхода из аккаунта */
  private connectionGeneration = 0;
  private session: Session | null = null;
  private endedTimer: unknown = null;

  private readonly now: () => number;
  private readonly schedule: (fn: () => void, ms: number) => unknown;
  private readonly cancelSchedule: (handle: unknown) => void;
  private readonly logError: (message: string, error: unknown) => void;
  private readonly systemUi: SystemCallUi;

  constructor(private readonly deps: CallManagerDeps) {
    this.now = deps.now ?? Date.now;
    this.systemUi = deps.systemUi ?? NOOP_SYSTEM_UI;
    this.schedule = deps.schedule ?? ((fn, ms) => setTimeout(fn, ms));
    this.cancelSchedule =
      deps.cancelSchedule ??
      (handle => clearTimeout(handle as ReturnType<typeof setTimeout>));
    this.logError =
      deps.logError ??
      ((message, error) => console.warn(`[calls] ${message}`, error));
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): CallSnapshot => this.snapshot;

  // ---------- соединение с сервером ----------

  connect(): Promise<void> {
    if (this.signaling) {
      return Promise.resolve();
    }
    if (this.connecting) {
      return this.connecting;
    }

    const generation = this.connectionGeneration;
    this.connecting = (async () => {
      const token = await this.deps.getToken();
      if (
        !token ||
        this.signaling ||
        generation !== this.connectionGeneration
      ) {
        return;
      }
      const client = this.deps.createSignaling(token);
      this.bindSignaling(client);
      this.signaling = client;
    })().finally(() => {
      this.connecting = null;
    });
    return this.connecting;
  }

  /** Выход из аккаунта: завершить звонок и перестать принимать входящие */
  disconnect(): void {
    this.connectionGeneration += 1;
    if (this.session) {
      this.hangup();
    }
    this.signaling?.disconnect();
    this.signaling = null;
  }

  // ---------- действия пользователя ----------

  async startCall(orderId: string, peerName: string): Promise<void> {
    if (this.session) {
      return;
    }
    const session = this.openSession({
      orderId,
      peerName,
      role: 'caller',
      callId: null,
    });
    this.setCall({phase: 'outgoing', orderId, peerName});

    try {
      await this.connect();
      const signaling = this.requireSignaling();
      session.peer = await this.createPeerFor(session);
      if (session.isClosed) {
        return;
      }

      this.deps.audio.startOutgoing();
      const {callId} = await signaling.invite(orderId);
      session.callId = callId;
      // Пользователь нажал «Завершить», пока invite был в пути
      if (session.isClosed) {
        this.sendEnd(callId);
      }
    } catch (error) {
      this.failSession(session, error);
    }
  }

  async accept(): Promise<void> {
    const session = this.session;
    const {call} = this.snapshot;
    if (
      !session?.callId ||
      session.role !== 'callee' ||
      call.phase !== 'incoming'
    ) {
      return;
    }

    if (!this.systemUi.showsIncomingUi) {
      this.deps.audio.stopIncomingRingtone();
    }
    this.setCall({
      phase: 'connecting',
      orderId: session.orderId,
      peerName: session.peerName,
    });

    try {
      // Приложение могло быть запущено пушем — сокет ещё не подключён
      await this.connect();
      // Peer создаётся до accept: offer звонящего может прийти сразу после ответа сервера
      session.peer = await this.createPeerFor(session);
      if (session.isClosed) {
        return;
      }
      // При CallKit аудиосессию активирует система (didActivateAudioSession)
      if (!this.systemUi.showsIncomingUi) {
        this.deps.audio.startSession();
      }
      await this.requireSignaling().accept(session.callId);
    } catch (error) {
      this.failSession(session, error);
    }
  }

  reject(): void {
    const session = this.session;
    if (
      !session?.callId ||
      session.role !== 'callee' ||
      this.snapshot.call.phase !== 'incoming'
    ) {
      return;
    }

    this.signaling
      ?.reject(session.callId)
      .catch(error => this.logError('reject не отправлен', error));
    this.closeSession(session);
    this.setCall({phase: 'idle'});
  }

  hangup(): void {
    const session = this.session;
    if (!session) {
      return;
    }
    if (this.snapshot.call.phase === 'incoming') {
      this.reject();
      return;
    }
    if (session.callId) {
      this.sendEnd(session.callId);
    }
    this.closeSession(session);
    this.showEnded(session.peerName, CALL_MESSAGES.ended);
  }

  /**
   * Входящий из VoIP/FCM-пуша. Дубли (тот же звонок пришёл и сокетом, и пушем) отсекаются по callId.
   * Просроченный звонок не показываем: сервер уже завершил его по таймауту.
   */
  handlePushedIncoming(call: PushedIncomingCall): void {
    if (call.expiresAt !== undefined && call.expiresAt <= this.now()) {
      this.systemUi.reportEnded(call.callId);
      return;
    }
    if (this.session?.callId === call.callId) {
      return;
    }
    if (this.session) {
      // Уже идёт другой звонок: на iOS нативный код успел показать CallKit — закрываем его
      this.systemUi.reportEnded(call.callId);
      return;
    }
    this.onIncoming(call);
    this.connect().catch(error =>
      this.logError('не удалось подключиться после пуша', error),
    );
  }

  /**
   * «Отклонить» в уведомлении, когда приложение не запущено (headless-задача Android):
   * без экрана и рингтона — только отказ на сервере. Промис завершается после ответа сервера,
   * чтобы задача не завершилась раньше отправки.
   */
  async rejectPushedCall(callId: string): Promise<void> {
    const session = this.findSession(callId);
    if (session) {
      this.reject();
      return;
    }
    await this.connect();
    await this.requireSignaling().reject(callId);
  }

  /** «Ответить» на системном экране звонка */
  answerFromSystem(callId: string): void {
    if (this.findSession(callId) && this.snapshot.call.phase === 'incoming') {
      this.accept().catch(error =>
        this.logError('ответ с системного экрана не удался', error),
      );
    }
  }

  /** «Сбросить»/«Завершить» на системном экране звонка */
  endFromSystem(callId: string): void {
    if (this.findSession(callId)) {
      this.hangup();
    }
  }

  toggleMute(): void {
    const peer = this.session?.peer;
    if (!peer) {
      return;
    }
    const isMuted = !this.snapshot.isMuted;
    peer.setMuted(isMuted);
    this.update({...this.snapshot, isMuted});
  }

  toggleSpeaker(): void {
    if (!this.session) {
      return;
    }
    const isSpeakerOn = !this.snapshot.isSpeakerOn;
    this.deps.audio.setSpeaker(isSpeakerOn);
    this.update({...this.snapshot, isSpeakerOn});
  }

  // ---------- события сервера ----------

  private bindSignaling(client: CallSignalingClient): void {
    client.on('call:incoming', event => this.onIncoming(event));
    client.on('call:accepted', event => this.onAccepted(event));
    client.on('call:signal', event => this.onRemoteSignal(event));
    client.on('call:ended', event => this.onRemoteEnded(event));
    client.on('call:resume', event => this.onResume(event));
    client.onUnauthorized(() => this.disconnect());
  }

  private onIncoming(event: IncomingCallEvent): void {
    // Сервер не пускает второй звонок к занятому участнику; это защита от рассинхронизации
    if (this.session) {
      return;
    }
    this.openSession({
      orderId: event.orderId,
      peerName: event.caller.name,
      role: 'callee',
      callId: event.callId,
    });
    this.setCall({
      phase: 'incoming',
      orderId: event.orderId,
      peerName: event.caller.name,
    });
    if (this.systemUi.showsIncomingUi) {
      this.systemUi.reportIncoming({
        callId: event.callId,
        orderId: event.orderId,
        callerName: event.caller.name,
      });
    } else {
      this.deps.audio.startIncomingRingtone();
    }
  }

  private onAccepted(event: CallAcceptedEvent): void {
    const session = this.findSession(event.callId);
    if (!session || session.role !== 'caller') {
      return;
    }

    this.deps.audio.stopRingback();
    this.setCall({
      phase: 'connecting',
      orderId: session.orderId,
      peerName: session.peerName,
    });
    session.peer
      ?.createOffer()
      .catch(error => this.failSession(session, error));
  }

  private onRemoteSignal(event: CallSignalEvent): void {
    const session = this.findSession(event.callId);
    if (!session?.peer) {
      return;
    }
    session.peer
      .handleSignal(event.kind, event.payload)
      .catch(error => this.failSession(session, error));
  }

  private onRemoteEnded(event: CallEndedEvent): void {
    const session = this.findSession(event.callId);
    if (!session) {
      return;
    }
    this.closeSession(session);
    this.showEnded(session.peerName, getEndMessage(event.status, session.role));
  }

  /** После переподключения сокета сервер сообщает о незавершённом звонке */
  private onResume(event: CallResumeEvent): void {
    if (this.findSession(event.callId)) {
      return;
    }

    if (
      !this.session &&
      event.role === 'callee' &&
      event.status === 'ringing'
    ) {
      this.onIncoming({
        callId: event.callId,
        orderId: event.orderId,
        caller: this.deps.fallbackCaller,
      });
      return;
    }
    // Медиасоединение этого звонка уже потеряно (например, приложение перезапускалось)
    this.sendEnd(event.callId);
  }

  private onPeerStatus(session: Session, status: PeerConnectionStatus): void {
    if (session !== this.session || session.isClosed) {
      return;
    }
    const {call} = this.snapshot;

    if (status === 'failed') {
      if (session.callId) {
        this.sendEnd(session.callId);
      }
      this.closeSession(session);
      this.showEnded(session.peerName, CALL_MESSAGES.connectionLost);
      return;
    }
    if (
      status === 'connected' &&
      (call.phase === 'connecting' || call.phase === 'active')
    ) {
      const connectedAt =
        call.phase === 'active' ? call.connectedAt : this.now();
      this.setCall({
        phase: 'active',
        orderId: call.orderId,
        peerName: call.peerName,
        connectedAt,
        isReconnecting: false,
      });
      return;
    }
    if (status === 'reconnecting' && call.phase === 'active') {
      this.setCall({...call, isReconnecting: true});
    }
  }

  // ---------- внутреннее ----------

  private requireSignaling(): CallSignalingClient {
    if (!this.signaling) {
      throw new CallRequestError(
        NETWORK_ERROR_CODE,
        CALL_MESSAGES.notConnected,
      );
    }
    return this.signaling;
  }

  private async createPeerFor(session: Session): Promise<CallPeerLike> {
    const iceServers = await this.deps.fetchIceServers();
    const peer = await this.deps.createPeer(iceServers, {
      onLocalSignal: (kind, payload) => this.sendSignal(session, kind, payload),
      onConnectionChange: status => this.onPeerStatus(session, status),
    });
    if (session.isClosed) {
      peer.close();
    }
    return peer;
  }

  private sendSignal(
    session: Session,
    kind: SignalKind,
    payload: SignalPayload,
  ): void {
    if (session.isClosed || !session.callId) {
      return;
    }
    this.signaling
      ?.signal(session.callId, kind, payload)
      .catch(error => this.logError(`сигнал ${kind} не отправлен`, error));
  }

  private sendEnd(callId: string): void {
    this.signaling
      ?.end(callId)
      .catch(error => this.logError('end не отправлен', error));
  }

  private findSession(callId: string): Session | null {
    const session = this.session;
    return session && !session.isClosed && session.callId === callId
      ? session
      : null;
  }

  private openSession(
    init: Pick<Session, 'orderId' | 'peerName' | 'role' | 'callId'>,
  ): Session {
    this.clearEndedTimer();
    const session: Session = {...init, peer: null, isClosed: false};
    this.session = session;
    return session;
  }

  private failSession(session: Session, error: unknown): void {
    if (session.isClosed) {
      return;
    }
    if (
      !(error instanceof CallRequestError) &&
      !(error instanceof MicrophonePermissionError)
    ) {
      this.logError('ошибка звонка', error);
    }
    if (session.callId) {
      this.sendEnd(session.callId);
    }
    this.closeSession(session);
    this.showEnded(session.peerName, toUserMessage(error));
  }

  private closeSession(session: Session): void {
    if (session.isClosed) {
      return;
    }
    session.isClosed = true;
    session.peer?.close();
    if (session.callId) {
      this.systemUi.reportEnded(session.callId);
    }
    this.deps.audio.stopIncomingRingtone();
    this.deps.audio.stopRingback();
    this.deps.audio.stopSession();
    if (this.session === session) {
      this.session = null;
    }
    this.update({...this.snapshot, isMuted: false, isSpeakerOn: false});
  }

  private showEnded(peerName: string, message: string): void {
    this.setCall({phase: 'ended', peerName, message});
    this.clearEndedTimer();
    this.endedTimer = this.schedule(() => {
      this.endedTimer = null;
      if (this.snapshot.call.phase === 'ended') {
        this.setCall({phase: 'idle'});
      }
    }, ENDED_SCREEN_MS);
  }

  private clearEndedTimer(): void {
    if (this.endedTimer !== null) {
      this.cancelSchedule(this.endedTimer);
      this.endedTimer = null;
    }
  }

  private setCall(call: CallState): void {
    this.update({...this.snapshot, call});
  }

  private update(snapshot: CallSnapshot): void {
    this.snapshot = snapshot;
    this.listeners.forEach(listener => listener());
  }
}
