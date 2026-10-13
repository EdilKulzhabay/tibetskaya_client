/**
 * Android: foreground-сервис типа microphone на время звонка. Без него свёрнутое приложение
 * получает от микрофона тишину (Android 9+) — собеседник перестаёт слышать.
 *
 * Сервис запускается только при выданном RECORD_AUDIO: иначе Android 14+ бросает
 * SecurityException. Микрофон запрашивает getUserMedia при создании peer — уже после
 * перехода в outgoing/connecting, поэтому update вызывается на каждой смене фазы
 * и повторяет попытку запуска.
 */
import type {CallState} from './callManager';

export interface CallForegroundServiceDeps {
  hasMicrophonePermission(): Promise<boolean>;
  start(peerName: string): Promise<void>;
  stop(): Promise<void>;
  logger?: Pick<Console, 'warn'>;
}

export interface CallForegroundService {
  /** peerName — идёт звонок с микрофоном, null — звонка нет */
  update(peerName: string | null): Promise<void>;
}

/** Фазы, в которых peer держит микрофон */
export const ongoingCallPeerName = (call: CallState): string | null =>
  call.phase === 'outgoing' ||
  call.phase === 'connecting' ||
  call.phase === 'active'
    ? call.peerName
    : null;

export const createCallForegroundService = ({
  hasMicrophonePermission,
  start,
  stop,
  logger = console,
}: CallForegroundServiceDeps): CallForegroundService => {
  let isRunning = false;
  // Последовательно: конец звонка во время запуска сервиса не должен обогнать сам запуск
  let queue: Promise<void> = Promise.resolve();

  const apply = async (peerName: string | null): Promise<void> => {
    if (peerName === null) {
      if (!isRunning) return;
      isRunning = false;
      await stop();
      return;
    }
    if (isRunning || !(await hasMicrophonePermission())) return;
    await start(peerName);
    isRunning = true;
  };

  return {
    update(peerName) {
      queue = queue
        .then(() => apply(peerName))
        .catch(error => logger.warn('[calls] foreground-сервис звонка', error));
      return queue;
    },
  };
};
