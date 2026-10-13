/**
 * Android: пуш о звонке — FCM data (high priority), входящий — уведомление notifee.
 * iOS-реализация — callPlatform.ios.ts.
 */
import notifee, {Event, EventType} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import {Alert, NativeModules, PermissionsAndroid} from 'react-native';
import {
  createCallDeliverySettings,
  DeliverySettingStep,
} from './callDeliverySettings';
import {createCallForegroundService} from './callForegroundService';
import type {CallManager} from './callManager';
import type {CallPlatform} from './callPlatformTypes';
import {CALL_PUSH_TYPES, parseCallPush} from './callPushPayload';
import {
  cancelIncomingCallNotification,
  displayOngoingCallNotification,
  INCOMING_CALL_ACTIONS,
  readCallFromNotificationEvent,
  stopOngoingCallNotification,
} from './incomingCallNotification';

interface CallLockScreenModule {
  setEnabled(isEnabled: boolean): void;
  canUseFullScreenIntent(): Promise<boolean>;
  openFullScreenIntentSettings(): Promise<boolean>;
  openXiaomiPermissionSettings(): Promise<boolean>;
}

const lockScreen = NativeModules.CallLockScreen as
  | CallLockScreenModule
  | undefined;

const logError = (message: string) => (error: unknown) =>
  console.warn(`[calls] ${message}`, error);

const XIAOMI_MANUFACTURER = 'xiaomi';

/** Порядок — по важности: без первых двух звонок не доходит вовсе */
const DELIVERY_SETTING_STEPS: readonly DeliverySettingStep[] = [
  {
    id: 'autostart',
    message:
      'Включите автозапуск для приложения — иначе звонки от курьера не приходят, если приложение закрыто.',
    isVerifiable: false,
    isNeeded: async () =>
      (await notifee.getPowerManagerInfo()).activity != null,
    open: () => notifee.openPowerManagerSettings(),
  },
  {
    id: 'batteryOptimization',
    message:
      'Снимите ограничения батареи для приложения — иначе система может не доставить звонок от курьера.',
    isVerifiable: true,
    isNeeded: () => notifee.isBatteryOptimizationEnabled(),
    open: () => notifee.openBatteryOptimizationSettings(),
  },
  {
    id: 'fullScreenIntent',
    message:
      'Разрешите полноэкранные уведомления — так звонок от курьера откроется на заблокированном телефоне.',
    isVerifiable: true,
    isNeeded: async () =>
      lockScreen ? !(await lockScreen.canUseFullScreenIntent()) : false,
    open: async () => lockScreen?.openFullScreenIntentSettings(),
  },
  {
    id: 'xiaomiLockScreen',
    message:
      'В разделе «Другие разрешения» включите «Экран блокировки» и «Всплывающие окна, когда работает в фоне» — так звонок от курьера откроется на заблокированном телефоне.',
    isVerifiable: false,
    isNeeded: async () =>
      lockScreen != null &&
      (await notifee.getPowerManagerInfo()).manufacturer?.toLowerCase() ===
        XIAOMI_MANUFACTURER,
    open: async () => lockScreen?.openXiaomiPermissionSettings(),
  },
];

const askToOpenSettings = (message: string): Promise<boolean> =>
  new Promise(resolve => {
    Alert.alert(
      'Чтобы не пропускать звонки',
      message,
      [
        {text: 'Позже', style: 'cancel', onPress: () => resolve(false)},
        {text: 'Открыть настройки', onPress: () => resolve(true)},
      ],
      {cancelable: true, onDismiss: () => resolve(false)},
    );
  });

const ongoingCallService = createCallForegroundService({
  hasMicrophonePermission: () =>
    PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO),
  start: displayOngoingCallNotification,
  stop: stopOngoingCallNotification,
});

const deliverySettings = createCallDeliverySettings({
  steps: DELIVERY_SETTING_STEPS,
  storage: AsyncStorage,
  ask: askToOpenSettings,
});

const handleNotificationEvent = (manager: CallManager, event: Event) => {
  const pressed = readCallFromNotificationEvent(event);
  if (!pressed) {
    return;
  }
  const {call, actionId} = pressed;
  manager.handlePushedIncoming(call);

  if (actionId === INCOMING_CALL_ACTIONS.decline) {
    manager.endFromSystem(call.callId);
    return;
  }
  // Экран звонка уже в приложении — уведомление больше не нужно (и рингтон тоже)
  cancelIncomingCallNotification(call.callId).catch(
    logError('не удалось убрать уведомление'),
  );
  if (actionId === INCOMING_CALL_ACTIONS.answer) {
    manager.answerFromSystem(call.callId);
  }
};

export const callPlatform: CallPlatform = {
  systemUi: {
    // Когда приложение открыто, входящий показывает свой экран звонка
    showsIncomingUi: false,
    reportIncoming: () => {},
    reportEnded: callId => {
      cancelIncomingCallNotification(callId).catch(
        logError('не удалось убрать уведомление'),
      );
    },
  },

  start(manager) {
    // Приложение открыто: пуш дублирует событие сокета, уведомление не показываем
    const unsubscribeMessages = messaging().onMessage(async remoteMessage => {
      const push = parseCallPush(remoteMessage.data);
      if (push?.type === CALL_PUSH_TYPES.incoming) {
        manager.handlePushedIncoming(push.call);
      } else if (push?.type === CALL_PUSH_TYPES.ended) {
        await cancelIncomingCallNotification(push.callId);
      }
    });
    const unsubscribeNotifications = notifee.onForegroundEvent(event =>
      handleNotificationEvent(manager, event),
    );
    // Приложение запущено нажатием на уведомление о звонке (или full-screen intent)
    notifee
      .getInitialNotification()
      .then(initial => {
        if (initial) {
          handleNotificationEvent(manager, {
            type: EventType.PRESS,
            detail: {
              notification: initial.notification,
              pressAction: initial.pressAction,
            },
          });
        }
      })
      .catch(logError('getInitialNotification'));

    return () => {
      unsubscribeMessages();
      unsubscribeNotifications();
    };
  },

  watchPushToken(onToken) {
    const report = (token: string) =>
      onToken({platform: 'android', token, apnsEnvironment: null});
    messaging().getToken().then(report).catch(logError('FCM-токен'));
    return messaging().onTokenRefresh(report);
  },

  setShowOverLockScreen(isEnabled) {
    lockScreen?.setEnabled(isEnabled);
  },

  setOngoingCall(peerName) {
    ongoingCallService.update(peerName);
  },

  ensureDeliverySettings: deliverySettings.ensure,
};
