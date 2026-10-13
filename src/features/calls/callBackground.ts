/**
 * Обработчики для index.js, работающие без UI (приложение в фоне или убито, Android).
 */
import type {Event} from '@notifee/react-native';
import {callManager} from './callStore';
import {
  cancelIncomingCallNotification,
  INCOMING_CALL_ACTIONS,
  readCallFromNotificationEvent,
} from './incomingCallNotification';

export {handleCallPushInBackground} from './incomingCallNotification';

/**
 * «Отклонить» в уведомлении о звонке. «Ответить» и нажатие на уведомление
 * открывают приложение (launchActivity) и обрабатываются в callPlatform.start.
 * @returns true, если событие относилось к звонку
 */
export const handleCallNotificationBackgroundEvent = async (
  event: Event,
): Promise<boolean> => {
  const pressed = readCallFromNotificationEvent(event);
  if (!pressed) {
    return false;
  }
  if (pressed.actionId !== INCOMING_CALL_ACTIONS.decline) {
    return true;
  }
  await cancelIncomingCallNotification(pressed.call.callId);
  try {
    await callManager.rejectPushedCall(pressed.call.callId);
  } catch (error) {
    // Сервер всё равно завершит звонок как пропущенный по таймауту
    console.warn('[calls] не удалось отклонить звонок из уведомления', error);
  }
  return true;
};
