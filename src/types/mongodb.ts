// Типы для MongoDB схемы заказа
// Соответствуют схеме mongoose из backend

import { 
  OrderAddress, 
  OrderProduct, 
  OrderDate, 
  OrderStatus,
  Courier,
  CourierAggregator 
} from './navigation';

export interface OrderDocument {
  _id: string;
  franchisee?: string; // ObjectId reference to User
  client?: string; // ObjectId reference to Client
  address: OrderAddress;
  products: OrderProduct;
  date: OrderDate;
  status: OrderStatus;
  sum: number;
  courier?: string; // ObjectId reference to Courier
  courierAggregator?: string; // ObjectId reference to CourierAggregator
  history: string[];
  transferred: boolean;
  transferredFranchise?: string;
  opForm?: string;
  comment?: string;
  clientReview: number;
  clientNotes: string[];
  income: number;
  aquaMarketAddress: string;
  reason: string;
  forAggregator: boolean;
  priority: number;
  isUrgent: boolean;
  clientPhone: string;
  createdAt: string;
  updatedAt: string;
}

// Типы для связанных документов
export interface CourierDocument extends Courier {
  createdAt: string;
  updatedAt: string;
}

export interface CourierAggregatorDocument extends CourierAggregator {
  createdAt: string;
  updatedAt: string;
}

export interface ClientDocument {
  _id: string;
  userName: string;
  phone: string;
  email?: string;
  addresses?: OrderAddress[];
  createdAt: string;
  updatedAt: string;
}

export interface UserDocument {
  _id: string;
  userName: string;
  mail: string;
  avatar?: string;
  phone?: string;
  password?: string;
  notificationPushToken?: string;
  balance?: number;
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
  dailyWaterIntake?: number;
  isStartedHydration?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Типы для API запросов
export interface CreateOrderRequest {
  client: string;
  address: OrderAddress;
  products: OrderProduct;
  date: OrderDate;
  comment?: string;
  clientPhone?: string;
  franchisee?: string;
  forAggregator?: boolean;
  priority?: number;
  isUrgent?: boolean;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  courier?: string;
  courierAggregator?: string;
  comment?: string;
  clientReview?: number;
  clientNotes?: string[];
  reason?: string;
  transferred?: boolean;
  transferredFranchise?: string;
  opForm?: string;
  income?: number;
  aquaMarketAddress?: string;
  forAggregator?: boolean;
  priority?: number;
  isUrgent?: boolean;
  clientPhone?: string;
}

// Типы для ответов API
export interface OrderResponse extends Omit<OrderDocument, 'franchisee' | 'client' | 'courier' | 'courierAggregator'> {
  courier?: CourierDocument;
  courierAggregator?: CourierAggregatorDocument;
  client?: ClientDocument;
  franchisee?: UserDocument;
}

export interface OrdersListResponse {
  orders: OrderResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
