import type { User } from '../types';

/** Значение opForm для оплаты с кошелька (баланс или купон бутылей) */
export function getWalletOpFormForUser(user: User | null | undefined): 'credit' | 'coupon' | null {
  if (!user) return null;
  if (user.paymentMethod === 'coupon') return 'coupon';
  if (user.paymentMethod === 'balance') return 'credit';
  return null;
}
