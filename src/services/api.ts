import {ApiResponse, User} from '../types';

// Базовый URL для API (замените на ваш)
const BASE_URL = 'https://api.tibetskayacrm.kz';

/**
 * Базовый класс для работы с API
 */
class ApiService {
  private baseURL: string;

  constructor(baseURL: string = BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Базовый метод для выполнения HTTP запросов
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка сети');
      }

      return {
        data,
        success: true,
      };
    } catch (error) {
      return {
        data: null as any,
        success: false,
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }

  /**
   * GET запрос
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {method: 'GET'});
  }

  /**
   * POST запрос
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT запрос
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE запрос
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {method: 'DELETE'});
  }
}

// Создаем экземпляр API сервиса
export const apiService = new ApiService();

/**
 * Сервис для работы с пользователями
 */
export const userService = {
  /**
   * Получить информацию о текущем пользователе
   */
  getCurrentUser: (): Promise<ApiResponse<User>> => {
    return apiService.get<User>('/user/me');
  },

  /**
   * Получить пользователя по ID
   */
  getUserById: (id: string): Promise<ApiResponse<User>> => {
    return apiService.get<User>(`/user/${id}`);
  },

  /**
   * Обновить профиль пользователя
   */
  updateProfile: (userData: Partial<User>): Promise<ApiResponse<User>> => {
    return apiService.put<User>('/user/profile', userData);
  },
};
