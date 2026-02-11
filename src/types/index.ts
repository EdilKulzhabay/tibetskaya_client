// Общие типы для приложения

export interface User {
  _id: string;
  userName: string;
  mail: string;
  avatar?: string;
  phone?: string;
  password?: string;
  notificationPushToken?: string;
  balance?: number;
  bonus?: number;
  // Новые поля для раздельного учета бутылок
  paidBootlesFor19?: number;
  paidBootlesFor12?: number;
  doesItTake19Bottles?: boolean;
  doesItTake12Bottles?: boolean;
  // Старое поле для обратной совместимости
  paidBootles?: number;
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
  supportMessages?: {
    _id: string;
    text: string;
    isUser: boolean;
    timestamp: string;
    isRead: boolean;
  }[];
  createdAt: string;
  paymentMethod?: string;
  savedCard?: {
    cardToken?: string;
    cardId?: string;
    cardPan?: string; // последние 4 цифры карты
  };
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
  userName: string;
  phone: string;
  password: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

export interface SupportMessage {
  _id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  isRead?: boolean;
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
