/**
 * Блокировка заказов из-за неподтверждённого АВР (флаг client.avrBlocked задаётся в CRM).
 *
 * Модуль без зависимостей: api/services.ts сообщает сюда об ответе сервера с кодом
 * AVR_BLOCKED, а AvrBlockProvider подписывается и показывает модалку. Прямой импорт
 * контекста из services.ts дал бы цикл services → context → useAuth → services.
 */
export const AVR_BLOCKED_CODE = 'AVR_BLOCKED';

type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeAvrBlocked(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyAvrBlocked(): void {
  listeners.forEach(listener => listener());
}

/** Ошибка axios от /addOrderClientMobile, когда клиент заблокирован по АВР. */
export function isAvrBlockedError(error: unknown): boolean {
  const code = (error as {response?: {data?: {code?: unknown}}})?.response?.data
    ?.code;
  return code === AVR_BLOCKED_CODE;
}
