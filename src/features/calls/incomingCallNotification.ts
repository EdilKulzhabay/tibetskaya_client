import notifee, {
  AndroidCategory,
  AndroidForegroundServiceType,
  AndroidImportance,
  AndroidVisibility,
  Event,
  EventType,
} from '@notifee/react-native';
import type {FirebaseMessagingTypes} from '@react-native-firebase/messaging';
import {Platform} from 'react-native';
import type {PushedIncomingCall} from './callManager';
import {CALL_PUSH_TYPES, parseCallPush} from './callPushPayload';

const CHANNEL_ID = 'incoming_calls';
const VIBRATION_PATTERN = [300, 700];

export const INCOMING_CALL_ACTIONS = {
  answer: 'call_answer',
  decline: 'call_decline',
  open: 'call_open',
} as const;

const notificationId = (callId: string) => `incoming_call_${callId}`;

const ensureChannel = () =>
  notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Входящие звонки',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: 'default',
    vibration: true,
    vibrationPattern: VIBRATION_PATTERN,
  });

/**
 * Уведомление о входящем (Android): рингтон по кругу, «Ответить»/«Отклонить»,
 * full-screen intent — на заблокированном экране открывается экран звонка.
 * Снимается само, когда звонок на сервере истекает.
 */
export const displayIncomingCallNotification = async (
  call: PushedIncomingCall,
): Promise<void> => {
  const remainingMs = (call.expiresAt ?? 0) - Date.now();
  if (remainingMs <= 0) {
    return;
  }
  const channelId = await ensureChannel();
  await notifee.displayNotification({
    id: notificationId(call.callId),
    title: call.caller.name,
    body: 'Входящий звонок по заказу',
    // notifee передаёт data только строками — тот же формат, что у FCM-пуша
    data: {
      type: CALL_PUSH_TYPES.incoming,
      callId: call.callId,
      orderId: call.orderId,
      callerType: call.caller.type,
      callerName: call.caller.name,
      expiresAt: String(call.expiresAt),
    },
    android: {
      channelId,
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      ongoing: true,
      autoCancel: false,
      loopSound: true,
      timeoutAfter: remainingMs,
      pressAction: {id: INCOMING_CALL_ACTIONS.open, launchActivity: 'default'},
      fullScreenAction: {
        id: INCOMING_CALL_ACTIONS.open,
        launchActivity: 'default',
      },
      actions: [
        {title: 'Отклонить', pressAction: {id: INCOMING_CALL_ACTIONS.decline}},
        {
          title: 'Ответить',
          pressAction: {
            id: INCOMING_CALL_ACTIONS.answer,
            launchActivity: 'default',
          },
        },
      ],
    },
  });
};

export const cancelIncomingCallNotification = (callId: string): Promise<void> =>
  notifee.cancelNotification(notificationId(callId));

const ONGOING_CALL_CHANNEL_ID = 'ongoing_calls';
const ONGOING_CALL_NOTIFICATION_ID = 'ongoing_call';

/**
 * Регистрируется в index.js. Сервис живёт, пока JS не вызовет stopForegroundService,
 * поэтому задача ничего не делает и не завершается.
 */
export const registerOngoingCallService = (): void => {
  notifee.registerForegroundService(() => new Promise<void>(() => {}));
};

/** Уведомление идущего звонка — запускает foreground-сервис типа microphone (callForegroundService.ts) */
export const displayOngoingCallNotification = async (
  peerName: string,
): Promise<void> => {
  const channelId = await notifee.createChannel({
    id: ONGOING_CALL_CHANNEL_ID,
    name: 'Текущий звонок',
    importance: AndroidImportance.LOW,
    visibility: AndroidVisibility.PUBLIC,
  });
  await notifee.displayNotification({
    id: ONGOING_CALL_NOTIFICATION_ID,
    title: peerName,
    body: 'Идёт звонок по заказу',
    android: {
      channelId,
      category: AndroidCategory.CALL,
      asForegroundService: true,
      foregroundServiceTypes: [
        AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MICROPHONE,
      ],
      ongoing: true,
      autoCancel: false,
      pressAction: {id: 'default', launchActivity: 'default'},
    },
  });
};

export const stopOngoingCallNotification = async (): Promise<void> => {
  await notifee.stopForegroundService();
  await notifee.cancelNotification(ONGOING_CALL_NOTIFICATION_ID);
};

/**
 * Для setBackgroundMessageHandler в index.js (приложение в фоне или убито).
 * @returns true, если это был пуш о звонке и он обработан
 */
export const handleCallPushInBackground = async (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }
  const push = parseCallPush(remoteMessage.data);
  if (!push) {
    return false;
  }
  if (push.type === CALL_PUSH_TYPES.incoming) {
    await displayIncomingCallNotification(push.call);
  } else {
    await cancelIncomingCallNotification(push.callId);
  }
  return true;
};

/** Звонок из уведомления, по которому пользователь нажал кнопку */
export const readCallFromNotificationEvent = ({
  type,
  detail,
}: Event): {call: PushedIncomingCall; actionId: string} | null => {
  if (type !== EventType.ACTION_PRESS && type !== EventType.PRESS) {
    return null;
  }
  const push = parseCallPush(detail.notification?.data);
  if (push?.type !== CALL_PUSH_TYPES.incoming) {
    return null;
  }
  return {
    call: push.call,
    actionId: detail.pressAction?.id ?? INCOMING_CALL_ACTIONS.open,
  };
};
