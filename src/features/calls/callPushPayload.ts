import type {PushedIncomingCall} from './callManager';
import type {ParticipantType} from './callTypes';

export const CALL_PUSH_TYPES = {
  incoming: 'incoming_call',
  ended: 'call_ended',
} as const;

const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;
const MAX_CALLER_NAME_LENGTH = 100;
const PARTICIPANT_TYPES: readonly ParticipantType[] = ['client', 'courier'];

export type CallPush =
  | {type: typeof CALL_PUSH_TYPES.incoming; call: PushedIncomingCall}
  | {type: typeof CALL_PUSH_TYPES.ended; callId: string};

/**
 * CallKit требует UUID, у звонка — ObjectId. Совпадает с callIdToUuid на сервере
 * (crm/calls/push/callPushNotifier.js) и в AppDelegate.
 */
export const callIdToUuid = (callId: string): string => {
  const hex = `${callId.toLowerCase()}00000000`;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16,
  )}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
};

export const uuidToCallId = (uuid: string): string =>
  uuid.replace(/-/g, '').slice(0, 24).toLowerCase();

const asString = (value: unknown): string | null =>
  typeof value === 'string' ? value : null;

/** Быстрая проверка для чужих обработчиков пушей: это пуш о звонке? */
export const isCallPushData = (data: unknown): boolean => {
  const type = (data as {type?: unknown} | null | undefined)?.type;
  return type === CALL_PUSH_TYPES.incoming || type === CALL_PUSH_TYPES.ended;
};

/**
 * Разбор пуша о звонке (VoIP-payload iOS или FCM data Android).
 * Данные пуша недоверенные: проверяем каждое поле, при ошибке — null.
 */
export const parseCallPush = (data: unknown): CallPush | null => {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const record = data as Record<string, unknown>;
  const callId = asString(record.callId);
  if (!callId || !OBJECT_ID_PATTERN.test(callId)) {
    return null;
  }

  if (record.type === CALL_PUSH_TYPES.ended) {
    return {type: CALL_PUSH_TYPES.ended, callId};
  }
  if (record.type !== CALL_PUSH_TYPES.incoming) {
    return null;
  }

  const orderId = asString(record.orderId);
  const callerType = record.callerType as ParticipantType;
  const callerName = asString(record.callerName)?.trim();
  const expiresAt = Number(record.expiresAt);
  if (
    !orderId ||
    !OBJECT_ID_PATTERN.test(orderId) ||
    !PARTICIPANT_TYPES.includes(callerType) ||
    !callerName ||
    !Number.isFinite(expiresAt)
  ) {
    return null;
  }

  return {
    type: CALL_PUSH_TYPES.incoming,
    call: {
      callId,
      orderId,
      caller: {
        type: callerType,
        name: callerName.slice(0, MAX_CALLER_NAME_LENGTH),
      },
      expiresAt,
    },
  };
};
