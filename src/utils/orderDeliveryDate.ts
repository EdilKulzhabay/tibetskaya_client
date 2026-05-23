import type { User } from '../types';
import {
  addDaysYmd,
  getDateYmdAlmaty,
  getHourAlmaty,
  nextYmd,
  weekdayFromYmd,
} from './dateAlmaty';

/** Час до которого принимаются заказы «на сегодня» (поле с сервера, иначе 19) */
export function getOrderSameDayCutoffHour(user: User | null | undefined): number {
  const h = user?.orderSameDayUntilHour;
  if (typeof h === 'number' && Number.isFinite(h) && h >= 0 && h <= 23) {
    return Math.floor(h);
  }
  return 19;
}

/** Первая доступная дата доставки YYYY-MM-DD (воскресенья пропускаются) */
export function computeNextDeliveryYmd(user: User | null | undefined): string {
  const cutoff = getOrderSameDayCutoffHour(user);
  const todayYmd = getDateYmdAlmaty(new Date());
  const dow = weekdayFromYmd(todayYmd);
  const h = getHourAlmaty(new Date());

  if (dow !== 0 && h < cutoff) {
    return todayYmd;
  }
  let ymd = nextYmd(todayYmd);
  while (weekdayFromYmd(ymd) === 0) {
    ymd = nextYmd(ymd);
  }
  return ymd;
}

/** Первая дата в календаре заказа и список следующих дней (без вс) */
export function firstSelectableDeliveryYmd(user: User | null | undefined): string {
  const cutoff = getOrderSameDayCutoffHour(user);
  const todayYmd = getDateYmdAlmaty(new Date());
  const canUseToday = weekdayFromYmd(todayYmd) !== 0 && getHourAlmaty(new Date()) < cutoff;
  if (canUseToday) {
    return todayYmd;
  }
  let ymd = nextYmd(todayYmd);
  while (weekdayFromYmd(ymd) === 0) {
    ymd = nextYmd(ymd);
  }
  return ymd;
}

export function buildSelectableDeliveryDates(
  user: User | null | undefined,
  maxNonSundayDays: number = 14,
  maxIterations: number = 40
): { value: string; label: string }[] {
  const startYmd = firstSelectableDeliveryYmd(user);
  const todayYmd = getDateYmdAlmaty(new Date());
  const out: { value: string; label: string }[] = [];
  for (let i = 0; i < maxIterations && out.length < maxNonSundayDays; i++) {
    const ymd = addDaysYmd(startYmd, i);
    if (weekdayFromYmd(ymd) === 0) continue;

    const dowRu = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][weekdayFromYmd(ymd)];
    const parts = ymd.split('-').map(Number);
    const localD = new Date(parts[0], parts[1] - 1, parts[2]);

    const label =
      ymd === todayYmd
        ? 'Сегодня'
        : `${dowRu}, ${localD.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`;

    out.push({ value: ymd, label });
  }
  return out;
}

/** Текст алерта «заказ принят» для выбранной даты доставки (YYYYMMDD, Алматы). */
export function getDeliveryAcceptTextFromYmd(orderYmd: string): string {
  const todayYmd = getDateYmdAlmaty(new Date());
  const tomorrowYmd = nextYmd(todayYmd);

  if (orderYmd === todayYmd) {
    return 'Заказ принят на сегодня';
  }
  if (orderYmd === tomorrowYmd) {
    return 'Заказ принят на завтра';
  }
  const dayNames = ['воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'];
  return `Заказ принят на ${dayNames[weekdayFromYmd(orderYmd)]}`;
}
