import type { User } from '../types';

/**
 * Единый id клиента для API (Mongo ObjectId строкой).
 * Учитывает разный формат _id после JSON/Mongoose.
 */
export function getClientMongoId(user: User | Record<string, unknown> | null | undefined): string {
  if (!user) return '';
  const u = user as Record<string, unknown>;
  const raw = u._id ?? u.id;
  if (raw == null || raw === '') return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object' && raw !== null && '$oid' in raw) {
    return String((raw as { $oid: string }).$oid);
  }
  return String(raw);
}
