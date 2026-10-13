import {CallEndStatus} from './callTypes';

export type CallRole = 'caller' | 'callee';

export const CALL_MESSAGES = {
  ended: 'Звонок завершён',
  connectionLost: 'Связь прервалась',
  genericFailure: 'Не удалось соединить звонок',
  notConnected: 'Нет соединения с сервером. Проверьте интернет',
} as const;

const END_MESSAGES: Record<CallEndStatus, Record<CallRole, string>> = {
  ended: {caller: CALL_MESSAGES.ended, callee: CALL_MESSAGES.ended},
  rejected: {caller: 'Абонент отклонил звонок', callee: CALL_MESSAGES.ended},
  missed: {caller: 'Абонент не отвечает', callee: 'Пропущенный звонок'},
  cancelled: {caller: 'Звонок отменён', callee: 'Пропущенный звонок'},
  failed: {
    caller: CALL_MESSAGES.connectionLost,
    callee: CALL_MESSAGES.connectionLost,
  },
};

export const getEndMessage = (status: CallEndStatus, role: CallRole): string =>
  END_MESSAGES[status]?.[role] ?? CALL_MESSAGES.ended;
