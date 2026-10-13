import api from '../../api/axios';
import {getDeviceId} from '../../utils/deviceId';
import {callPlatform} from './callPlatform';
import type {CallPushTokenInfo} from './callPlatformTypes';

const PUSH_TOKEN_PATH = '/calls/push-token';

let registeredToken: CallPushTokenInfo | null = null;

/**
 * Отправляет на сервер токен для пушей о звонках (VoIP на iOS, FCM на Android)
 * и обновляет его при смене. Возвращает отписку.
 */
export const startCallPushRegistration = (): (() => void) =>
  callPlatform.watchPushToken(info => {
    // Сервер шлёт пуш о звонке только на токены устройства, с которого создан заказ
    getDeviceId()
      .then(deviceId => api.post(PUSH_TOKEN_PATH, {...info, deviceId}))
      .then(() => {
        registeredToken = info;
      })
      .catch(error =>
        console.warn('[calls] не удалось зарегистрировать push-токен', error),
      );
  });

/** Выход из аккаунта: вызывать до удаления токена авторизации */
export const unregisterCallPush = async (): Promise<void> => {
  if (!registeredToken) {
    return;
  }
  const {token} = registeredToken;
  registeredToken = null;
  await api.delete(PUSH_TOKEN_PATH, {data: {token}});
};
