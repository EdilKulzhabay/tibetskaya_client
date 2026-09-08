import AsyncStorage from '@react-native-async-storage/async-storage';
import {getDateYmdAlmaty} from './dateAlmaty';

/** Версия приложения — единственное место объявления, используется и для телеметрии
 * (HomeScreen отправляет её в CRM), и для сравнения с `latestAppVersion` из CRM. */
export const APP_VERSION = '2.0.0';

const LAST_SHOWN_KEY = 'newVersionModalLastShownDate';

/** Показываем модалку не чаще раза в день (по календарю Алматы) и только если
 * в CRM настроена версия, отличная от установленной. */
export async function shouldShowNewVersionModal(
  latestAppVersion?: string | null,
): Promise<boolean> {
  if (!latestAppVersion || latestAppVersion === APP_VERSION) return false;
  try {
    const lastShown = await AsyncStorage.getItem(LAST_SHOWN_KEY);
    return lastShown !== getDateYmdAlmaty(new Date());
  } catch {
    return false;
  }
}

export async function markNewVersionModalShown(): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_SHOWN_KEY, getDateYmdAlmaty(new Date()));
  } catch {
    /* AsyncStorage недоступен — не блокируем закрытие модалки */
  }
}
