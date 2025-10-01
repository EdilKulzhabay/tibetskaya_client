import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Ключи для сохранения данных в AsyncStorage
 */
export const STORAGE_KEYS = {
  USER: 'user',
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  APP_SETTINGS: 'app_settings',
  PROFILE_IMAGE: 'profile_image',
} as const;

/**
 * Универсальная функция для сохранения данных в AsyncStorage
 */
export const saveData = async <T>(key: string, data: T): Promise<void> => {
  try {
    const jsonData = JSON.stringify(data);
    await AsyncStorage.setItem(key, jsonData);
    console.log(`Данные успешно сохранены с ключом: ${key}`);
  } catch (error) {
    console.error(`Ошибка при сохранении данных с ключом ${key}:`, error);
    throw error;
  }
};

/**
 * Универсальная функция для получения данных из AsyncStorage
 */
export const getData = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonData = await AsyncStorage.getItem(key);
    if (jsonData === null) {
      return null;
    }
    return JSON.parse(jsonData) as T;
  } catch (error) {
    console.error(`Ошибка при чтении данных с ключом ${key}:`, error);
    throw error;
  }
};

/**
 * Функция для удаления данных из AsyncStorage
 */
export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
    console.log(`Данные успешно удалены с ключом: ${key}`);
  } catch (error) {
    console.error(`Ошибка при удалении данных с ключом ${key}:`, error);
    throw error;
  }
};

/**
 * Функция для полной очистки AsyncStorage
 */
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
    console.log('Все данные успешно удалены из AsyncStorage');
  } catch (error) {
    console.error('Ошибка при очистке AsyncStorage:', error);
    throw error;
  }
};

/**
 * Функция для получения всех ключей из AsyncStorage
 */
export const getAllKeys = async (): Promise<readonly string[]> => {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    console.error('Ошибка при получении ключей из AsyncStorage:', error);
    throw error;
  }
};

// Специализированные функции для работы с данными пользователя
export const userStorage = {
  /**
   * Сохранить данные пользователя
   */
  save: async (userData: any): Promise<void> => {
    return saveData(STORAGE_KEYS.USER, userData);
  },

  /**
   * Получить данные пользователя
   */
  get: async (): Promise<any | null> => {
    return getData(STORAGE_KEYS.USER);
  },

  /**
   * Удалить данные пользователя
   */
  remove: async (): Promise<void> => {
    return removeData(STORAGE_KEYS.USER);
  },
};

// Функции для работы с токенами
export const tokenStorage = {
  /**
   * Сохранить токен доступа
   */
  saveAuthToken: async (token: string): Promise<void> => {
    return saveData(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  /**
   * Получить токен доступа
   */
  getAuthToken: async (): Promise<string | null> => {
    return getData(STORAGE_KEYS.AUTH_TOKEN);
  },

  /**
   * Сохранить refresh токен
   */
  saveRefreshToken: async (token: string): Promise<void> => {
    return saveData(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  /**
   * Получить refresh токен
   */
  getRefreshToken: async (): Promise<string | null> => {
    return getData(STORAGE_KEYS.REFRESH_TOKEN);
  },

  /**
   * Удалить все токены
   */
  removeTokens: async (): Promise<void> => {
    await Promise.all([
      removeData(STORAGE_KEYS.AUTH_TOKEN),
      removeData(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
  },
};

// Функции для работы с фото профиля
export const profileImageStorage = {
  /**
   * Сохранить URI фото профиля
   */
  save: async (imageUri: string): Promise<void> => {
    return saveData(STORAGE_KEYS.PROFILE_IMAGE, imageUri);
  },

  /**
   * Получить URI фото профиля
   */
  get: async (): Promise<string | null> => {
    return getData(STORAGE_KEYS.PROFILE_IMAGE);
  },

  /**
   * Удалить фото профиля
   */
  remove: async (): Promise<void> => {
    return removeData(STORAGE_KEYS.PROFILE_IMAGE);
  },
};
