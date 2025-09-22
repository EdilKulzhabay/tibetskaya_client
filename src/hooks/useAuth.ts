import { useState, useEffect, useCallback } from 'react';
import { User, RegisterData, LoadingState } from '../types';
import { userStorage, tokenStorage } from '../utils/storage';
import { apiService } from '../api/services';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loadingState: LoadingState;
  error: string | null;
}

interface AuthActions {
  saveUserData: (data: User) => Promise<void>;
  register: (registerData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (field: string, value: any) => Promise<void>;
}

export type UseAuthReturn = AuthState & AuthActions;

/**
 * Хук для управления аутентификацией и состоянием пользователя
 */
export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = user !== null;

  /**
   * Загрузка пользователя из локального хранилища при инициализации
   */
  const loadUserFromStorage = useCallback(async () => {
    try {
      setLoadingState('loading');
      const savedUser = await userStorage.get();
      
      if (savedUser) {
        setUser(savedUser);
        console.log('Пользователь загружен из локального хранилища:', savedUser.mail);
      }
      
      setLoadingState('success');
    } catch (error) {
      console.error('Ошибка при загрузке пользователя:', error);
      setError('Не удалось загрузить данные пользователя');
      setLoadingState('error');
    }
  }, []);

  /**
   * Функция входа в систему
   */
  const saveUserData = useCallback(async (responseData: any) => {
    try {
      setLoadingState('loading');
      setError(null);

      console.log("responseData = ", responseData);

      // Извлекаем данные из ответа сервера
      const { clientData, accessToken, refreshToken } = responseData;

      // Создаем объект пользователя из серверного ответа
      const userData: User = {
        _id: clientData._id,
        fullName: clientData.fullName,
        mail: clientData.mail,
        avatar: '',
        phone: clientData.phone,
        notificationPushToken: clientData.expoPushToken || "",
        balance: clientData.bonus || 0,
        price12: clientData.price12 || 0,
        price19: clientData.price19 || 0,
        status: clientData.status,
        cart: clientData.cart,
        addresses: clientData.addresses || [],
        createdAt: clientData.createdAt,
        isStartedHydration: clientData.isStartedHydration || false,
      };

      // Сохраняем пользователя и токены из сервера
      await Promise.all([
        userStorage.save(userData),
        tokenStorage.saveAuthToken(accessToken),
        tokenStorage.saveRefreshToken(refreshToken),
      ]);

      setUser(userData);
      setLoadingState('success');
      console.log('Пользователь и токены сохранены:', userData.mail);
    } catch (error) {
      console.error('Ошибка при входе:', error);
      setError(error instanceof Error ? error.message : 'Ошибка при входе в систему');
      setLoadingState('error');
      throw error;
    }
  }, []);

  /**
   * Функция регистрации
   */
  const register = useCallback(async (registerData: RegisterData) => {
    try {
      setLoadingState('loading');
      setError(null);

      // Здесь будет вызов API для регистрации
      // Пример мокового ответа:
      const newUser: User = {
        _id: Date.now().toString(),
        fullName: registerData.fullName,
        mail: registerData.mail,
        avatar: '',
        createdAt: new Date().toISOString(),
      };

      // Симулируем запрос к API
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Сохраняем пользователя и токены
      await Promise.all([
        userStorage.save(newUser),
        tokenStorage.saveAuthToken('new_user_token_123'),
        tokenStorage.saveRefreshToken('new_user_refresh_456'),
      ]);

      setUser(newUser);
      setLoadingState('success');
      console.log('Успешная регистрация:', registerData.mail);
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      setError(error instanceof Error ? error.message : 'Ошибка при регистрации');
      setLoadingState('error');
      throw error;
    }
  }, []);

  /**
   * Функция выхода из системы
   */
  const logout = useCallback(async () => {
    try {
      setLoadingState('loading');

      // Удаляем данные из локального хранилища
      await Promise.all([
        userStorage.remove(),
        tokenStorage.removeTokens(),
      ]);

      setUser(null);
      setError(null);
      setLoadingState('idle');
      console.log('Успешный выход из системы');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      setError('Ошибка при выходе из системы');
      setLoadingState('error');
    }
  }, []);

  /**
   * Очистка ошибки
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Обновление данных пользователя
   */
  const refreshUser = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoadingState('loading');
      // Здесь будет вызов API для получения свежих данных пользователя
      // Пока используем данные из локального хранилища
      await loadUserFromStorage();
    } catch (error) {
      console.error('Ошибка при обновлении пользователя:', error);
      setError('Не удалось обновить данные пользователя');
      setLoadingState('error');
    }
  }, [isAuthenticated, loadUserFromStorage]);

  /**
   * Обновление данных пользователя
   */
  const updateUser = useCallback(async (field: string, value: any) => {
    if (!user) return;

    try {
      setLoadingState('loading');

      console.log("userData in updateUser = ", field, value);
      
      const res = await apiService.updateData(user.mail, field, value);
      
      // Сохраняем обновленные данные
      await userStorage.save(res.clientData);
      setUser(res.clientData);
      setLoadingState('success');
      console.log('Данные пользователя обновлены');
    } catch (error) {
      console.error('Ошибка при обновлении пользователя:', error);
      setError('Не удалось обновить данные пользователя');
      setLoadingState('error');
      throw error;
    }
  }, [user]);

  // Загружаем пользователя при инициализации хука
  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  return {
    // State
    user,
    isAuthenticated,
    loadingState,
    error,
    
    // Actions
    saveUserData,
    register,
    logout,
    clearError,
    refreshUser,
    updateUser,
  };
};
