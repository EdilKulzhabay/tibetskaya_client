import {AppEventsLogger} from 'react-native-fbsdk-next';
import type {User} from '../types';

const CURRENCY = 'KZT';
const CONTENT_TYPE = 'product';
const BOTTLE_12_5L_SKU = 'bottle_12_5l';
const BOTTLE_18_9L_SKU = 'bottle_18_9l';

interface OrderProducts {
  b12: number;
  b19: number;
}

function buildContentIds(products: OrderProducts): string {
  const ids: string[] = [];
  for (let i = 0; i < products.b12; i += 1) {
    ids.push(BOTTLE_12_5L_SKU);
  }
  for (let i = 0; i < products.b19; i += 1) {
    ids.push(BOTTLE_18_9L_SKU);
  }
  return JSON.stringify(ids);
}

/** Facebook App Events: событие "Регистрация" (CompleteRegistration). */
export function logRegistrationCompleted(registrationMethod: string): void {
  AppEventsLogger.logEvent(AppEventsLogger.AppEvents.CompletedRegistration, {
    [AppEventsLogger.AppEventParams.RegistrationMethod]: registrationMethod,
  });
}

interface OrderEventParams {
  user: User | null;
  products: OrderProducts;
  totalAmount: number;
  orderId?: string;
}

/**
 * Facebook App Events для успешно оформленного и оплаченного заказа:
 * - "Первый заказ" (кастомное событие FirstOrder) — только если appOrdersPlacedCount
 *   клиента ещё 0, т.е. это первый заказ через приложение.
 * - "Оплата" (стандартный Purchase) — всегда.
 */
export function logOrderPurchaseEvents({
  user,
  products,
  totalAmount,
  orderId,
}: OrderEventParams): void {
  const contentIds = buildContentIds(products);
  const resolvedOrderId = orderId || `local-${Date.now()}`;
  const isFirstOrder = (user?.appOrdersPlacedCount ?? 0) === 0;

  if (isFirstOrder) {
    AppEventsLogger.logEvent('FirstOrder', totalAmount, {
      [AppEventsLogger.AppEventParams.OrderId]: resolvedOrderId,
      [AppEventsLogger.AppEventParams.Currency]: CURRENCY,
      [AppEventsLogger.AppEventParams.ContentID]: contentIds,
    });
  }

  AppEventsLogger.logPurchase(totalAmount, CURRENCY, {
    [AppEventsLogger.AppEventParams.OrderId]: resolvedOrderId,
    [AppEventsLogger.AppEventParams.ContentID]: contentIds,
    [AppEventsLogger.AppEventParams.ContentType]: CONTENT_TYPE,
  });
}
