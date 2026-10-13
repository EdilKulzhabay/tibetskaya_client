import {CallRequestError, MicrophonePermissionError} from '../callErrors';
import {
  CallManager,
  CallState,
  ENDED_SCREEN_MS,
  SystemCallUi,
} from '../callManager';
import type {CallAudio} from '../callAudio';
import type {CallPeerHandlers, CallPeerLike} from '../callPeer';
import type {CallSignalingClient} from '../callSignaling';
import type {InviteResult, ServerToClientEvents} from '../callTypes';

const ORDER_ID = 'a'.repeat(24);
const CALL_ID = 'b'.repeat(24);

type Handlers = Partial<{
  [E in keyof ServerToClientEvents]: ServerToClientEvents[E];
}>;

const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return {promise, resolve};
};

const flush = () => new Promise(resolve => setImmediate(resolve));

const createFakeSignaling = () => {
  const handlers: Handlers = {};
  let unauthorized: () => void = () => {};
  const client = {
    on: jest.fn((event: keyof ServerToClientEvents, handler: never) => {
      (handlers as Record<string, unknown>)[event] = handler;
    }),
    onUnauthorized: jest.fn((handler: () => void) => {
      unauthorized = handler;
    }),
    invite: jest.fn(
      async (): Promise<InviteResult> => ({
        callId: CALL_ID,
        orderId: ORDER_ID,
        callee: {type: 'client', name: 'Айгерим'},
      }),
    ),
    accept: jest.fn(async () => {}),
    reject: jest.fn(async () => {}),
    end: jest.fn(async () => {}),
    signal: jest.fn(async () => {}),
    disconnect: jest.fn(),
  } satisfies CallSignalingClient;
  return {client, handlers, triggerUnauthorized: () => unauthorized()};
};

const createFakePeer = () => {
  let peerHandlers: CallPeerHandlers | null = null;
  const peer = {
    createOffer: jest.fn(async () => {}),
    handleSignal: jest.fn(async () => {}),
    setMuted: jest.fn(),
    close: jest.fn(),
  } satisfies CallPeerLike;
  return {
    peer,
    capture: (handlers: CallPeerHandlers) => {
      peerHandlers = handlers;
    },
    handlers: (): CallPeerHandlers => {
      if (!peerHandlers) {
        throw new Error('peer not created');
      }
      return peerHandlers;
    },
  };
};

const createFakeAudio = (): jest.Mocked<CallAudio> => ({
  startIncomingRingtone: jest.fn(),
  stopIncomingRingtone: jest.fn(),
  startOutgoing: jest.fn(),
  startSession: jest.fn(),
  stopRingback: jest.fn(),
  stopSession: jest.fn(),
  setSpeaker: jest.fn(),
});

interface SetupOptions {
  token?: string | null;
  createPeer?: () => Promise<CallPeerLike>;
  systemUi?: SystemCallUi;
}

const createFakeSystemUi = (showsIncomingUi: boolean) => ({
  showsIncomingUi,
  reportIncoming: jest.fn(),
  reportEnded: jest.fn(),
});

const setup = (options: SetupOptions = {}) => {
  const signaling = createFakeSignaling();
  const fakePeer = createFakePeer();
  const audio = createFakeAudio();
  const scheduled: (() => void)[] = [];
  let now = 1_000;

  const manager = new CallManager({
    getToken: async () => ('token' in options ? options.token ?? null : 'jwt'),
    createSignaling: jest.fn(() => signaling.client),
    fetchIceServers: async () => [{urls: 'stun:example'}],
    createPeer: jest.fn(async (_ice, handlers) => {
      fakePeer.capture(handlers);
      return options.createPeer ? options.createPeer() : fakePeer.peer;
    }),
    audio,
    fallbackCaller: {type: 'courier', name: 'Курьер'},
    systemUi: options.systemUi,
    now: () => now,
    schedule: fn => {
      scheduled.push(fn);
      return scheduled.length;
    },
    cancelSchedule: () => {},
    logError: () => {},
  });

  const phase = (): CallState['phase'] => manager.getSnapshot().call.phase;
  const runScheduled = () => scheduled.splice(0).forEach(fn => fn());
  const advance = (ms: number) => {
    now += ms;
  };
  return {manager, signaling, fakePeer, audio, phase, runScheduled, advance};
};

const emitIncoming = (handlers: Handlers) =>
  handlers['call:incoming']?.({
    callId: CALL_ID,
    orderId: ORDER_ID,
    caller: {type: 'client', name: 'Айгерим'},
  });

describe('исходящий звонок', () => {
  test('invite → accepted → offer → connected: экран переходит в active', async () => {
    const {manager, signaling, fakePeer, audio, phase} = setup();

    await manager.startCall(ORDER_ID, 'Айгерим');
    expect(phase()).toBe('outgoing');
    expect(audio.startOutgoing).toHaveBeenCalled();
    expect(signaling.client.invite).toHaveBeenCalledWith(ORDER_ID);

    signaling.handlers['call:accepted']?.({callId: CALL_ID});
    expect(phase()).toBe('connecting');
    expect(audio.stopRingback).toHaveBeenCalled();
    expect(fakePeer.peer.createOffer).toHaveBeenCalled();

    fakePeer.handlers().onConnectionChange('connected');
    expect(phase()).toBe('active');
  });

  test('локальные SDP/ICE уходят на сервер с callId', async () => {
    const {manager, signaling, fakePeer} = setup();
    await manager.startCall(ORDER_ID, 'Айгерим');

    fakePeer.handlers().onLocalSignal('offer', {type: 'offer', sdp: 'v=0'});

    expect(signaling.client.signal).toHaveBeenCalledWith(CALL_ID, 'offer', {
      type: 'offer',
      sdp: 'v=0',
    });
  });

  test('сервер ответил BUSY: показываем сообщение сервера и освобождаем микрофон', async () => {
    const {manager, signaling, fakePeer, audio} = setup();
    signaling.client.invite.mockRejectedValueOnce(
      new CallRequestError('BUSY', 'Абонент занят'),
    );

    await manager.startCall(ORDER_ID, 'Айгерим');

    expect(manager.getSnapshot().call).toEqual({
      phase: 'ended',
      peerName: 'Айгерим',
      message: 'Абонент занят',
    });
    expect(fakePeer.peer.close).toHaveBeenCalled();
    expect(audio.stopSession).toHaveBeenCalled();
  });

  test('нет доступа к микрофону: invite не отправляется', async () => {
    const {manager, signaling} = setup({
      createPeer: async () => {
        throw new MicrophonePermissionError();
      },
    });

    await manager.startCall(ORDER_ID, 'Айгерим');

    expect(signaling.client.invite).not.toHaveBeenCalled();
    const {call} = manager.getSnapshot();
    expect(call.phase === 'ended' && call.message).toMatch(/микрофон/i);
  });

  test('«Завершить» во время invite: после ответа сервера отправляется end', async () => {
    const {manager, signaling, phase} = setup();
    const invite = createDeferred<InviteResult>();
    signaling.client.invite.mockReturnValueOnce(invite.promise);

    const started = manager.startCall(ORDER_ID, 'Айгерим');
    await flush();
    manager.hangup();
    expect(phase()).toBe('ended');

    invite.resolve({
      callId: CALL_ID,
      orderId: ORDER_ID,
      callee: {type: 'client', name: 'Айгерим'},
    });
    await started;

    expect(signaling.client.end).toHaveBeenCalledWith(CALL_ID);
    expect(phase()).toBe('ended');
  });

  test('без токена звонок не начинается', async () => {
    const {manager, signaling} = setup({token: null});

    await manager.startCall(ORDER_ID, 'Айгерим');

    expect(signaling.client.invite).not.toHaveBeenCalled();
    expect(manager.getSnapshot().call.phase).toBe('ended');
  });

  test('второй startCall во время звонка игнорируется', async () => {
    const {manager, signaling} = setup();
    await manager.startCall(ORDER_ID, 'Айгерим');
    await manager.startCall(ORDER_ID, 'Айгерим');
    expect(signaling.client.invite).toHaveBeenCalledTimes(1);
  });
});

describe('входящий звонок', () => {
  test('incoming → рингтон; accept создаёт peer до отправки accept', async () => {
    const {manager, signaling, audio, phase} = setup();
    await manager.connect();

    emitIncoming(signaling.handlers);
    expect(phase()).toBe('incoming');
    expect(audio.startIncomingRingtone).toHaveBeenCalled();

    await manager.accept();

    expect(audio.stopIncomingRingtone).toHaveBeenCalled();
    expect(audio.startSession).toHaveBeenCalled();
    expect(signaling.client.accept).toHaveBeenCalledWith(CALL_ID);
    expect(phase()).toBe('connecting');
  });

  test('offer от звонящего передаётся в peer', async () => {
    const {manager, signaling, fakePeer} = setup();
    await manager.connect();
    emitIncoming(signaling.handlers);
    await manager.accept();

    signaling.handlers['call:signal']?.({
      callId: CALL_ID,
      kind: 'offer',
      payload: {type: 'offer', sdp: 'v=0'},
    });

    expect(fakePeer.peer.handleSignal).toHaveBeenCalledWith('offer', {
      type: 'offer',
      sdp: 'v=0',
    });
  });

  test('reject: отправка на сервер и сразу idle без экрана завершения', async () => {
    const {manager, signaling, phase} = setup();
    await manager.connect();
    emitIncoming(signaling.handlers);

    manager.reject();

    expect(signaling.client.reject).toHaveBeenCalledWith(CALL_ID);
    expect(phase()).toBe('idle');
  });

  test('звонящий отменил до ответа — «Пропущенный звонок»', async () => {
    const {manager, signaling} = setup();
    await manager.connect();
    emitIncoming(signaling.handlers);

    signaling.handlers['call:ended']?.({
      callId: CALL_ID,
      orderId: ORDER_ID,
      status: 'cancelled',
      reason: 'cancelled',
      endedBy: 'client',
      durationSec: 0,
    });

    expect(manager.getSnapshot().call).toEqual({
      phase: 'ended',
      peerName: 'Айгерим',
      message: 'Пропущенный звонок',
    });
  });
});

describe('устойчивость', () => {
  test('события чужого callId игнорируются', async () => {
    const {manager, signaling, phase} = setup();
    await manager.startCall(ORDER_ID, 'Айгерим');

    signaling.handlers['call:accepted']?.({callId: 'c'.repeat(24)});

    expect(phase()).toBe('outgoing');
  });

  test('обрыв WebRTC (failed) завершает звонок и уведомляет сервер', async () => {
    const {manager, signaling, fakePeer} = setup();
    await manager.startCall(ORDER_ID, 'Айгерим');
    signaling.handlers['call:accepted']?.({callId: CALL_ID});

    fakePeer.handlers().onConnectionChange('failed');

    expect(signaling.client.end).toHaveBeenCalledWith(CALL_ID);
    const {call} = manager.getSnapshot();
    expect(call.phase === 'ended' && call.message).toBe('Связь прервалась');
  });

  test('временная потеря связи показывает «восстанавливаем», время начала сохраняется', async () => {
    const {manager, signaling, fakePeer, advance} = setup();
    await manager.startCall(ORDER_ID, 'Айгерим');
    signaling.handlers['call:accepted']?.({callId: CALL_ID});
    fakePeer.handlers().onConnectionChange('connected');
    const connected = manager.getSnapshot().call;

    advance(5_000);
    fakePeer.handlers().onConnectionChange('reconnecting');
    expect(manager.getSnapshot().call).toMatchObject({
      phase: 'active',
      isReconnecting: true,
    });

    fakePeer.handlers().onConnectionChange('connected');
    expect(manager.getSnapshot().call).toEqual({
      ...connected,
      isReconnecting: false,
    });
  });

  test('call:resume звонка, которого нет локально, — сервер получает end', async () => {
    const {manager, signaling} = setup();
    await manager.connect();

    signaling.handlers['call:resume']?.({
      callId: CALL_ID,
      orderId: ORDER_ID,
      status: 'accepted',
      role: 'caller',
    });

    expect(signaling.client.end).toHaveBeenCalledWith(CALL_ID);
  });

  test('экран завершения через ENDED_SCREEN_MS возвращается в idle', async () => {
    const {manager, phase, runScheduled} = setup();
    await manager.startCall(ORDER_ID, 'Айгерим');
    manager.hangup();
    expect(phase()).toBe('ended');

    runScheduled();

    expect(phase()).toBe('idle');
    expect(ENDED_SCREEN_MS).toBeGreaterThan(0);
  });

  test('disconnect (выход из аккаунта) завершает звонок и закрывает сокет', async () => {
    const {manager, signaling} = setup();
    await manager.startCall(ORDER_ID, 'Айгерим');

    manager.disconnect();

    expect(signaling.client.end).toHaveBeenCalledWith(CALL_ID);
    expect(signaling.client.disconnect).toHaveBeenCalled();
  });

  test('UNAUTHORIZED от сокета отключает менеджер', async () => {
    const {manager, signaling} = setup();
    await manager.connect();

    signaling.triggerUnauthorized();

    expect(signaling.client.disconnect).toHaveBeenCalled();
  });

  test('mute и динамик переключаются и сбрасываются после звонка', async () => {
    const {manager, fakePeer, audio} = setup();
    await manager.startCall(ORDER_ID, 'Айгерим');

    manager.toggleMute();
    manager.toggleSpeaker();
    expect(fakePeer.peer.setMuted).toHaveBeenCalledWith(true);
    expect(audio.setSpeaker).toHaveBeenCalledWith(true);
    expect(manager.getSnapshot()).toMatchObject({
      isMuted: true,
      isSpeakerOn: true,
    });

    manager.hangup();
    expect(manager.getSnapshot()).toMatchObject({
      isMuted: false,
      isSpeakerOn: false,
    });
  });
});

describe('звонок из пуша и системный экран', () => {
  const pushed = (
    overrides: Partial<{expiresAt: number; callId: string}> = {},
  ) => ({
    callId: CALL_ID,
    orderId: ORDER_ID,
    caller: {type: 'client' as const, name: 'Айгерим'},
    ...overrides,
  });

  test('пуш при закрытом приложении: входящий + подключение сокета', async () => {
    const {manager, signaling, phase} = setup();

    manager.handlePushedIncoming(pushed({expiresAt: 60_000}));
    await flush();

    expect(phase()).toBe('incoming');
    expect(signaling.client.on).toHaveBeenCalled();
  });

  test('дубль (сокет + пуш) не создаёт второй звонок', async () => {
    const {manager, signaling, audio} = setup();
    await manager.connect();
    emitIncoming(signaling.handlers);

    manager.handlePushedIncoming(pushed());

    expect(audio.startIncomingRingtone).toHaveBeenCalledTimes(1);
  });

  test('просроченный пуш не показывается, системный экран закрывается', () => {
    const systemUi = createFakeSystemUi(true);
    const {manager, phase} = setup({systemUi});

    manager.handlePushedIncoming(pushed({expiresAt: 500}));

    expect(phase()).toBe('idle');
    expect(systemUi.reportEnded).toHaveBeenCalledWith(CALL_ID);
  });

  test('пуш во время другого звонка: системный экран нового звонка закрывается', async () => {
    const systemUi = createFakeSystemUi(true);
    const {manager} = setup({systemUi});
    await manager.startCall(ORDER_ID, 'Айгерим');

    manager.handlePushedIncoming(pushed({callId: 'f'.repeat(24)}));

    expect(systemUi.reportEnded).toHaveBeenCalledWith('f'.repeat(24));
  });

  test('CallKit: входящий показывает система, свой рингтон и аудиосессия не запускаются', async () => {
    const systemUi = createFakeSystemUi(true);
    const {manager, audio, signaling} = setup({systemUi});

    manager.handlePushedIncoming(pushed());
    manager.answerFromSystem(CALL_ID);
    await flush();

    expect(systemUi.reportIncoming).toHaveBeenCalledWith({
      callId: CALL_ID,
      orderId: ORDER_ID,
      callerName: 'Айгерим',
    });
    expect(audio.startIncomingRingtone).not.toHaveBeenCalled();
    expect(audio.startSession).not.toHaveBeenCalled();
    expect(signaling.client.accept).toHaveBeenCalledWith(CALL_ID);
  });

  test('«Сбросить» на системном экране отклоняет входящий', async () => {
    const systemUi = createFakeSystemUi(true);
    const {manager, signaling, phase} = setup({systemUi});
    manager.handlePushedIncoming(pushed());
    await flush();

    manager.endFromSystem(CALL_ID);

    expect(signaling.client.reject).toHaveBeenCalledWith(CALL_ID);
    expect(phase()).toBe('idle');
    expect(systemUi.reportEnded).toHaveBeenCalledWith(CALL_ID);
  });

  test('завершение звонка закрывает системный экран, повторное событие от системы игнорируется', async () => {
    const systemUi = createFakeSystemUi(true);
    const {manager, signaling} = setup({systemUi});
    manager.handlePushedIncoming(pushed());
    manager.answerFromSystem(CALL_ID);
    await flush();

    manager.hangup();
    manager.endFromSystem(CALL_ID);

    expect(systemUi.reportEnded).toHaveBeenCalledWith(CALL_ID);
    expect(signaling.client.end).toHaveBeenCalledTimes(1);
  });

  test('«Отклонить» из уведомления без запущенного UI: отказ на сервере без экрана и рингтона', async () => {
    const {manager, signaling, audio, phase} = setup();

    await manager.rejectPushedCall(CALL_ID);

    expect(signaling.client.reject).toHaveBeenCalledWith(CALL_ID);
    expect(audio.startIncomingRingtone).not.toHaveBeenCalled();
    expect(phase()).toBe('idle');
  });
});
