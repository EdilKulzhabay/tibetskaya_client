import type { User } from '../types';

function invoiceLegalAsString(v: User['invoiceLegalData']): string {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return [o.binIin, o.legalName, o.legalAddress, o.invoicePhone]
      .map((x) => String(x ?? '').trim())
      .filter(Boolean)
      .join(', ');
  }
  return String(v).trim();
}

/**
 * Клиент может генерировать счёт, если в CRM заполнены порядковый номер и юр. текст.
 */
export function clientHasInvoiceProfile(user: User | null | undefined): boolean {
  if (!user) return false;
  const seq = String(user.invoiceSequentialNumber ?? '').trim();
  const legal = invoiceLegalAsString(user.invoiceLegalData);
  return !!(seq && legal);
}
