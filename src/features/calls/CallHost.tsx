import {useEffect} from 'react';
import {AppState} from 'react-native';
import {useAuth} from '../../hooks/useAuth';
import CallOverlay from './CallOverlay';
import {ongoingCallPeerName} from './callForegroundService';
import {callPlatform} from './callPlatform';
import {startCallPushRegistration} from './callPushRegistration';
import {callManager, useCallSnapshot} from './callStore';

/**
 * Держит сокет звонков, пока клиент авторизован: подключается после входа и при возврате
 * в приложение (iOS обрывает сокет в фоне), отключается при выходе — иначе
 * звонки продолжали бы приходить на разлогиненное устройство.
 * Там же — пуши о звонках (токен устройства) и события системного экрана звонка.
 */
export default function CallHost() {
  const {isAuthenticated} = useAuth();
  const {call} = useCallSnapshot();
  const isCallOnScreen = call.phase !== 'idle' && call.phase !== 'ended';
  const ongoingPeerName = ongoingCallPeerName(call);

  useEffect(() => {
    if (!isAuthenticated) {
      callManager.disconnect();
      return;
    }
    const connect = () => {
      callManager
        .connect()
        .catch(error => console.warn('[calls] не удалось подключиться', error));
      // При каждом возврате: пользователь вернулся из настроек — спросим следующую
      callPlatform.ensureDeliverySettings();
    };
    connect();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        connect();
      }
    });
    const stopPlatform = callPlatform.start(callManager);
    const stopPushRegistration = startCallPushRegistration();
    return () => {
      subscription.remove();
      stopPlatform();
      stopPushRegistration();
    };
  }, [isAuthenticated]);

  // Android: звонок, открытый из уведомления, виден поверх экрана блокировки — только пока он идёт
  useEffect(() => {
    callPlatform.setShowOverLockScreen(isCallOnScreen);
  }, [isCallOnScreen]);

  // Android: foreground-сервис, чтобы микрофон работал в свёрнутом приложении.
  // Фаза в зависимостях — повторить запуск, когда разрешение на микрофон выдано посреди звонка
  useEffect(() => {
    callPlatform.setOngoingCall(ongoingPeerName);
  }, [call.phase, ongoingPeerName]);

  return <CallOverlay />;
}
