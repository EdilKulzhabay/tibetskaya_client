import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Идентификатор установки приложения. Передаётся при создании заказа, регистрации
 * push-токена звонков и подключении к сокету звонков: звонок курьера по заказу идёт только
 * на устройство, с которого заказ создан (под одним аккаунтом может быть несколько телефонов).
 *
 * Живёт до удаления приложения. После переустановки устройство получает новый id — сервер
 * тогда не найдёт старое устройство заказа и позвонит на все устройства аккаунта.
 */
const STORAGE_KEY = 'appDeviceId';
const HEX_DIGITS = '0123456789abcdef';
const UUID_TEMPLATE = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';

/** UUID v4 без нативных модулей: это не секрет, Math.random достаточно */
export const createDeviceId = (random: () => number = Math.random): string =>
  UUID_TEMPLATE.replace(/[xy]/g, char => {
    const nibble = Math.floor(random() * 16);
    // Вариант RFC 4122: старшие биты 10xx
    return HEX_DIGITS[char === 'x' ? nibble : (nibble & 0x3) | 0x8];
  });

let deviceIdPromise: Promise<string> | null = null;

const loadOrCreateDeviceId = async (): Promise<string> => {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (stored) {
    return stored;
  }
  const created = createDeviceId();
  await AsyncStorage.setItem(STORAGE_KEY, created);
  return created;
};

/**
 * null — хранилище недоступно: заказ и звонки работают как раньше (на весь аккаунт),
 * следующий вызов попробует снова.
 */
export const getDeviceId = async (): Promise<string | null> => {
  deviceIdPromise ??= loadOrCreateDeviceId();
  try {
    return await deviceIdPromise;
  } catch (error) {
    deviceIdPromise = null;
    console.warn(
      '[deviceId] не удалось прочитать идентификатор устройства',
      error,
    );
    return null;
  }
};
