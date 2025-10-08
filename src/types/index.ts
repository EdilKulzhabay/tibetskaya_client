// Общие типы для приложения

export interface User {
  _id: string;
  fullName: string;
  mail: string;
  avatar?: string;
  phone?: string;
  password?: string;
  notificationPushToken?: string;
  balance?: number;
  bonus?: number;
  price12?: number;
  price19?: number;
  status?: string;
  cart?: {
    b12?: number;
    b19?: number;
  };
  addresses?: {
    _id: string;
    name: string;
    city: string;
    street: string;
    floor?: string;
    apartment?: string;
  }[];
  dailyWaterIntake?: number; // Потребление воды в мл за день
  isStartedHydration?: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Типы для навигации
export * from './navigation';

export interface NavigationProps {
  navigation: any; // Замените на правильный тип из вашей библиотеки навигации
  route?: any;
}

// Типы для состояния приложения (если используете Redux или Context)
export interface AppState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface RegisterData {
  mail: string;
  fullName: string;
  phone: string;
  password: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Дополнительные типы для приложения
export interface Franchisee {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Экспорт типов из navigation.ts
export * from './navigation';

// Экспорт типов из mongodb.ts
export * from './mongodb';
