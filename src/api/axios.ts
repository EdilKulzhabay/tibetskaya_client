import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { tokenStorage } from '../utils/storage';

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
  // baseURL: 'http://192.168.10.4:4444', // Замените на ваш базовый URL API
  baseURL: 'https://api.tibetskayacrm.kz', // Замените на ваш базовый URL API
  timeout: 30000, // Таймаут запроса в миллисекундах
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем перехватчик для запросов
api.interceptors.request.use(
  async (config) => {
    try {
      // Получаем токен авторизации из хранилища
      const accessToken = await tokenStorage.getAuthToken();
      
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
        console.log('Токен добавлен к запросу:', config.url);
      }
    } catch (error) {
      console.error('Ошибка при получении токена:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Добавляем перехватчик для ответов
api.interceptors.response.use(
  (response) => {
    // Логируем успешный запрос
    console.log('Успешный запрос:', {
      url: response.config.url,
      method: response.config.method,
      data: response.config.data,
      params: response.config.params,
      status: response.status
    });
    return response;
  },
  async (error) => {
    // Здесь можно обработать ошибки
    if (error.response) {
      // Сервер вернул ошибку
      console.error('Ошибка ответа:', {
        url: error.config.url,
        method: error.config.method,
        data: error.config.data,
        params: error.config.params,
        status: error.response.status,
        error: error.response.data
      });

      // Если токен истек (401 ошибка)
      if (error.response.status === 401) {
        console.log('Токен истек, удаляем токены...');
        
        try {
          // Очищаем токены при ошибке авторизации
          await tokenStorage.removeTokens();
          
          // Можно добавить перенаправление на экран входа
          // NavigationService.navigate('Login');
        } catch (cleanupError) {
          console.error('Ошибка при очистке токенов:', cleanupError);
        }
      }
    } else if (error.request) {
      // Запрос был сделан, но ответ не получен
      console.error('Ошибка запроса:', {
        url: error.config.url,
        method: error.config.method,
        error: error.request
      });
    } else {
      // Что-то пошло не так при настройке запроса
      console.error('Ошибка:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api; 

//classpath('com.google.gms:google-services:4.4.2')
//apply plugin: 'com.google.gms.google-services'