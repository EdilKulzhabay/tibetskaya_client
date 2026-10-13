import type {CallManager, SystemCallUi} from './callManager';

export interface CallPushTokenInfo {
  platform: 'ios' | 'android';
  token: string;
  /** Только iOS: debug-сборки получают токены песочницы APNs */
  apnsEnvironment: 'sandbox' | 'production' | null;
}

/**
 * Платформенная часть звонков. Реализации: callPlatform.ts (Android: FCM + notifee)
 * и callPlatform.ios.ts (PushKit + CallKit) — Metro выбирает файл по платформе.
 */
export interface CallPlatform {
  systemUi: SystemCallUi;
  /** Подписки на события системы (пуши, CallKit/уведомления). Возвращает отписку. */
  start(manager: CallManager): () => void;
  /** Текущий токен для пушей о звонках и его обновления. Возвращает отписку. */
  watchPushToken(onToken: (info: CallPushTokenInfo) => void): () => void;
  /** Показывать экран звонка поверх экрана блокировки (на iOS это делает CallKit) */
  setShowOverLockScreen(isEnabled: boolean): void;
  /** Идёт звонок с микрофоном (peerName) или нет (null): Android держит foreground-сервис */
  setOngoingCall(peerName: string | null): void;
  /** Попросить включить настройки, без которых пуш о звонке не доходит (Android) */
  ensureDeliverySettings(): Promise<void>;
}
