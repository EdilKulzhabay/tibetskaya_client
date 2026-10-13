/**
 * iOS: пуш о звонке — VoIP (PushKit), входящий — CallKit.
 * Нативная часть в AppDelegate.swift: на VoIP-пуш CallKit показывается синхронно, до загрузки JS —
 * иначе iOS перестаёт доставлять VoIP-пуши приложению. Здесь — реакция на действия в CallKit.
 */
import RNCallKeep, {InitialEvents} from 'react-native-callkeep';
import VoipPushNotification from 'react-native-voip-push-notification';
import {RTCAudioSession} from 'react-native-webrtc';
import type {CallManager} from './callManager';
import type {CallPlatform} from './callPlatformTypes';
import {
  CALL_PUSH_TYPES,
  callIdToUuid,
  parseCallPush,
  uuidToCallId,
} from './callPushPayload';

const APNS_ENVIRONMENT = __DEV__ ? 'sandbox' : 'production';

const CALLKEEP_EVENTS = {
  didDisplayIncomingCall: 'RNCallKeepDidDisplayIncomingCall',
  answerCall: 'RNCallKeepPerformAnswerCallAction',
  endCall: 'RNCallKeepPerformEndCallAction',
} as const;

const handlePushPayload = (manager: CallManager, payload: unknown) => {
  const push = parseCallPush(payload);
  if (push?.type === CALL_PUSH_TYPES.incoming) {
    manager.handlePushedIncoming(push.call);
  }
};

/** События CallKit, случившиеся до загрузки JS (звонок пришёл в убитое приложение) */
const replayInitialEvents = (manager: CallManager, events: InitialEvents) => {
  events.forEach(event => {
    if (event.name === CALLKEEP_EVENTS.didDisplayIncomingCall) {
      handlePushPayload(manager, event.data.payload);
    } else if (event.name === CALLKEEP_EVENTS.answerCall) {
      manager.answerFromSystem(uuidToCallId(event.data.callUUID));
    } else if (event.name === CALLKEEP_EVENTS.endCall) {
      manager.endFromSystem(uuidToCallId(event.data.callUUID));
    }
  });
};

export const callPlatform: CallPlatform = {
  systemUi: {
    showsIncomingUi: true,
    reportIncoming: ({callId, callerName}) => {
      // Если звонок уже показан из AppDelegate, CallKit вернёт CallUUIDAlreadyExists — это нормально
      RNCallKeep.displayIncomingCall(
        callIdToUuid(callId),
        callerName,
        callerName,
        'generic',
        false,
      );
    },
    reportEnded: callId => RNCallKeep.endCall(callIdToUuid(callId)),
  },

  start(manager) {
    const listeners = [
      RNCallKeep.addEventListener('didDisplayIncomingCall', ({payload}) =>
        handlePushPayload(manager, payload),
      ),
      RNCallKeep.addEventListener('answerCall', ({callUUID}) =>
        manager.answerFromSystem(uuidToCallId(callUUID)),
      ),
      RNCallKeep.addEventListener('endCall', ({callUUID}) =>
        manager.endFromSystem(uuidToCallId(callUUID)),
      ),
      // Аудиосессией звонка управляет CallKit — передаём её WebRTC
      RNCallKeep.addEventListener('didActivateAudioSession', () =>
        RTCAudioSession.audioSessionDidActivate(),
      ),
      RNCallKeep.addEventListener('didDeactivateAudioSession', () =>
        RTCAudioSession.audioSessionDidDeactivate(),
      ),
    ];
    VoipPushNotification.addEventListener('notification', payload =>
      handlePushPayload(manager, payload),
    );

    RNCallKeep.getInitialEvents()
      .then(events => {
        RNCallKeep.clearInitialEvents();
        replayInitialEvents(manager, events);
      })
      .catch(error => console.warn('[calls] getInitialEvents', error));

    return () => {
      listeners.forEach(listener => listener.remove());
      VoipPushNotification.removeEventListener('notification');
    };
  },

  watchPushToken(onToken) {
    const report = (token: string) =>
      onToken({platform: 'ios', token, apnsEnvironment: APNS_ENVIRONMENT});
    VoipPushNotification.addEventListener('register', report);
    VoipPushNotification.addEventListener('didLoadWithEvents', events => {
      events.forEach(({name, data}) => {
        if (
          name ===
            VoipPushNotification.RNVoipPushRemoteNotificationsRegisteredEvent &&
          typeof data === 'string'
        ) {
          report(data);
        }
      });
    });
    // Регистрация уже сделана в AppDelegate; повторный вызов присылает последний токен
    VoipPushNotification.registerVoipToken();
    return () => {
      VoipPushNotification.removeEventListener('register');
      VoipPushNotification.removeEventListener('didLoadWithEvents');
    };
  },

  setShowOverLockScreen: () => {},

  // Микрофон в фоне держат фоновые режимы audio/voip и CallKit
  setOngoingCall: () => {},

  // VoIP-пуши и CallKit работают без дополнительных настроек
  ensureDeliverySettings: async () => {},
};
