import type { User } from '../types';

function invoiceLegalAsString(v: User['invoiceLegalData']): string {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'object' && v !== null) {
    // Mongoose/ BSON или boxed String: typeof object, поля структуры пусты — не теряем строку
    if (Object.prototype.toString.call(v) === '[object String]') {
      return String(v as object).trim();
    }
    const o = v as Record<string, unknown>;
    const fromFields = [o.binIin, o.legalName, o.legalAddress, o.invoicePhone]
      .map((x) => String(x ?? '').trim())
      .filter(Boolean)
      .join(', ');
    if (fromFields) return fromFields;
    const fallback = String(v).trim();
    if (fallback && fallback !== '[object Object]') {
      return fallback;
    }
    return '';
  }
  return String(v).trim();
}

/**
 * Клиент может генерировать счёт, если в CRM заполнены порядковый номер и юр. текст.
 */
export function clientHasInvoiceProfile(user: User | null | undefined): boolean {
  if (!user) return false;
  return !!invoiceLegalAsString(user.invoiceLegalData);
}

/** Есть юр. данные для счёта (без требования порядкового номера). */
export function clientHasInvoiceLegalData(user: User | null | undefined): boolean {
  if (!user) return false;
  return !!invoiceLegalAsString(user.invoiceLegalData);
}
