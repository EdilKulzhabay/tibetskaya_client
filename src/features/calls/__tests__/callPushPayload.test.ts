import {
  callIdToUuid,
  isCallPushData,
  parseCallPush,
  uuidToCallId,
} from '../callPushPayload';

const CALL_ID = 'b'.repeat(24);
const ORDER_ID = 'a'.repeat(24);

const incomingData = (overrides: Record<string, unknown> = {}) => ({
  type: 'incoming_call',
  callId: CALL_ID,
  callUuid: callIdToUuid(CALL_ID),
  orderId: ORDER_ID,
  callerType: 'courier',
  callerName: 'Ерлан',
  expiresAt: '1700000000000',
  ...overrides,
});

describe('callIdToUuid / uuidToCallId', () => {
  test('совпадает с сервером и обратимо', () => {
    expect(callIdToUuid('0123456789ABCDEF01234567')).toBe(
      '01234567-89ab-cdef-0123-456700000000',
    );
    expect(uuidToCallId(callIdToUuid(CALL_ID))).toBe(CALL_ID);
  });
});

describe('parseCallPush', () => {
  test('FCM data (строки) → входящий звонок', () => {
    expect(parseCallPush(incomingData())).toEqual({
      type: 'incoming_call',
      call: {
        callId: CALL_ID,
        orderId: ORDER_ID,
        caller: {type: 'courier', name: 'Ерлан'},
        expiresAt: 1700000000000,
      },
    });
  });

  test('VoIP payload iOS (expiresAt числом) тоже разбирается', () => {
    const push = parseCallPush(incomingData({expiresAt: 1700000000000}));
    expect(push?.type).toBe('incoming_call');
  });

  test('отмена звонка', () => {
    expect(parseCallPush({type: 'call_ended', callId: CALL_ID})).toEqual({
      type: 'call_ended',
      callId: CALL_ID,
    });
  });

  test.each([
    ['не объект', 'string'],
    ['чужой тип', {...incomingData(), type: 'newOrder'}],
    ['битый callId', incomingData({callId: '../../etc'})],
    ['битый orderId', incomingData({orderId: {$ne: ''}})],
    ['неизвестная роль', incomingData({callerType: 'admin'})],
    ['пустое имя', incomingData({callerName: '   '})],
    ['без срока', incomingData({expiresAt: 'soon'})],
  ])('отклоняет некорректный пуш: %s', (_label, data) => {
    expect(parseCallPush(data)).toBeNull();
  });

  test('слишком длинное имя обрезается', () => {
    const push = parseCallPush(incomingData({callerName: 'Я'.repeat(500)}));
    expect(push?.type === 'incoming_call' && push.call.caller.name.length).toBe(
      100,
    );
  });
});

describe('isCallPushData', () => {
  test('отличает пуши звонков от прочих', () => {
    expect(isCallPushData(incomingData())).toBe(true);
    expect(isCallPushData({type: 'call_ended'})).toBe(true);
    expect(isCallPushData({newStatus: 'onTheWay'})).toBe(false);
    expect(isCallPushData(undefined)).toBe(false);
  });
});
