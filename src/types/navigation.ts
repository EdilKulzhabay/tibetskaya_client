// Типы для данных заказа
export interface OrderProduct {
  b12: number;
  b19: number;
  name?: string;
  price?: number;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Courier {
  id: string;
  fullName: string;
  phone?: string;
  rating?: number;
  photoUrl?: string;
  vehicleType?: 'car' | 'bike' | 'walk';
  vehicleNumber?: string;
  estimatedArrival?: string;
}

export interface OrderData {
  id: string;
  orderNumber?: string;
  date: string;
  createdAt?: string;
  status: 'awaitingOrder' | 'confirmed' | 'preparing' | 'onTheWay' | 'completed' | 'cancelled';
  products: OrderProduct[];
  courier?: Courier | null;
  
  // Адрес и местоположение
  address: string;
  fullAddress?: string;
  deliveryCoordinates?: Location;
  courierLocation?: Location;
  
  // Оплата и стоимость
  paymentMethod?: string;
  subtotal?: number;
  deliveryFee?: number;
  totalAmount: number;
  isPaid?: boolean;
  
  // Время доставки
  deliveryTime?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  
  // Дополнительная информация
  customerNotes?: string;
  courierNotes?: string;
  deliveryInstructions?: string;
  contactPhone?: string;
  
  // Статус обновления
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
};

export type TabParamList = {
  Home: undefined;
  Profile: undefined;
  History: undefined;
  Support: undefined;
};
