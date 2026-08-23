/**
 * Оставляет только латинские буквы и форматирует в XXXX-XXXX-XXXX (как на бэкенде,
 * см. crm/utils/referralCode.js:normalizeReferralCodeInput). Позволяет вставлять в поле
 * ввода не только сам код, но и всё пересланное сообщение целиком — лишнее обрежется.
 */
export function formatReferralCodeInput(raw: string): string {
  const letters = raw
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
    .slice(0, 12);
  return letters.match(/.{1,4}/g)?.join('-') ?? letters;
}

/**
 * Формулировка рассчитана на то, что получатель перешлёт/скопирует сообщение целиком
 * в поле «Реферальный код» — formatReferralCodeInput выше уже умеет выделить код
 * из произвольного текста, поэтому не обязательно копировать только код отдельно.
 */
export function buildReferralShareMessage(code: string): string {
  return `Скопируй это сообщение целиком и вставь его в поле «Реферальный код» при регистрации — приложение автоматически возьмёт код из текста.\nКод: ${code}`;
}
