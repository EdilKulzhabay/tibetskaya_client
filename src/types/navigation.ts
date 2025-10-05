// Типы для данных заказа
export interface OrderProduct {
  b12: number;
  b19: number;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Courier {
  _id: string;
  fullName: string;
  phone?: string;
  rating?: number;
  photoUrl?: string;
  vehicleType?: 'car' | 'bike' | 'walk';
  vehicleNumber?: string;
  estimatedArrival?: string;
}

export interface CourierAggregator {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  raiting?: number;
  carNumber?: string;
  carType?: 'A' | 'B' | 'C';
  transport?: 'A' | 'B' | 'C';
  onTheLine?: boolean;
  status?: 'awaitingVerfication' | 'active' | 'inActive' | 'deleted';
  point?: {
    lat: number;
    lon: number;
    timestamp?: Date;
  };
  balance?: number;
  income?: number;
  capacity12?: number;
  capacity19?: number;
  capacity?: number;
  completeFirstOrder?: boolean;
}

export interface OrderAddress {
  name: string;
  actual: string;
  link: string;
  phone: string;
  point: {
    lat: number;
    lon: number;
  };
}

export interface OrderDate {
  d: string;
  time: string;
}

export type OrderStatus = 
  | 'awaitingOrder' 
  | 'confirmed' 
  | 'preparing' 
  | 'onTheWay' 
  | 'delivered' 
  | 'cancelled';

export interface OrderData {
  _id: string;
  franchisee?: string; // ObjectId reference to User
  client?: string; // ObjectId reference to Client
  address: OrderAddress;
  products: OrderProduct;
  date: OrderDate;
  status: OrderStatus;
  sum: number;
  courier?: string | Courier; // ObjectId reference to Courier or populated Courier object
  courierAggregator?: string | CourierAggregator; // ObjectId reference to CourierAggregator or populated CourierAggregator object
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
  
  // Дополнительные поля для совместимости с UI
  orderNumber?: string;
  fullAddress?: string;
  deliveryCoordinates?: Location;
  courierLocation?: Location;
  paymentMethod?: string;
  subtotal?: number;
  deliveryFee?: number;
  totalAmount?: number;
  isPaid?: boolean;
  deliveryTime?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  customerNotes?: string;
  courierNotes?: string;
  deliveryInstructions?: string;
  contactPhone?: string;
  lastUpdated?: string;
  trackingHistory?: {
    timestamp: string;
    status: string;
    message: string;
    location?: Location;
  }[];
}

export interface AddressData {
  id: string;
  name: string;
  city: string;
  street: string;
  floor?: string;
  apartment?: string;
}

export interface RegisterData {
  mail: string;
  fullName: string;
  phone: string;
  password: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  History: undefined;
  Support: undefined;
  Bonus: undefined;
  Wallet: undefined;
  Chat: undefined;
  Address: undefined;
  AddOrUpdateAddress: {
    address: AddressData;
  };
  OrderStatus: {
    order: OrderData;
  };
  Login: undefined;
  Register: undefined;
  Otp: {
    data: RegisterData;
  };
  RegisterAccepted: undefined;
  ChangeData: undefined;
  Tarrifs: undefined;
  FAQ: undefined;
  Hydration: undefined;
  TakePartHydration: undefined;
  TakePartInvite: undefined;
  StartHydration: undefined;
  StartHydration2: undefined;
  AddOrder: undefined;
  Settings: undefined;
  WhatIsMyBalance: undefined;
  HowToTopUp: undefined;
};

export type TabParamList = {
  Home: undefined;
  Profile: undefined;
  History: undefined;
  Support: undefined;
};
