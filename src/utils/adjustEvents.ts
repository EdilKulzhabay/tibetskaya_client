import {Adjust, AdjustConfig, AdjustEvent} from 'react-native-adjust';

const APP_TOKEN = 'yrxzt3mogzk0';
const CURRENCY = 'KZT';

const EVENT_TOKEN_REGISTER = '4z92z0';
const EVENT_TOKEN_BALANCE = 'umvnxr';
const EVENT_TOKEN_ORDER = 'gy9oys';

/**
 * Инициализация Adjust SDK — вызывается один раз на старте приложения (App.tsx),
 * без этого вызовы trackEvent никуда не долетают. Sandbox — на dev-сборках,
 * чтобы тестовые события не портили боевую статистику по рекламе.
 */
export function initAdjust(): void {
  const environment = __DEV__
    ? AdjustConfig.EnvironmentSandbox
    : AdjustConfig.EnvironmentProduction;
  const adjustConfig = new AdjustConfig(APP_TOKEN, environment);
  Adjust.initSdk(adjustConfig);
}

/** Adjust-событие "Регистрация" — в дашборде Adjust помечено уникальным. */
export function logAdjustRegistration(): void {
  Adjust.trackEvent(new AdjustEvent(EVENT_TOKEN_REGISTER));
}

/** Adjust-событие "Пополнение баланса". `amount` — сумма пополнения в тенге, если известна. */
export function logAdjustBalanceTopUp(amount?: number): void {
  const event = new AdjustEvent(EVENT_TOKEN_BALANCE);
  if (typeof amount === 'number' && amount > 0) {
    event.setRevenue(amount, CURRENCY);
  }
  Adjust.trackEvent(event);
}

/** Adjust-событие "Создание заказа". `amount` — сумма заказа в тенге, если известна. */
export function logAdjustOrderCreated(amount?: number): void {
  const event = new AdjustEvent(EVENT_TOKEN_ORDER);
  if (typeof amount === 'number' && amount > 0) {
    event.setRevenue(amount, CURRENCY);
  }
  Adjust.trackEvent(event);
}
