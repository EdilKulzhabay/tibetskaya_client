import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Header, Navigation, OrderBlock } from '../components';

interface HistoryScreenProps {
  navigation?: any;
}

const orders = [
  {
    id: 1,
    orderNumber: 'TW-2025-001',
    date: '2025-01-01',
    createdAt: '2025-01-01T10:30:00Z',
    status: "awaitingOrder" as const,
    products: [
      {
        b12: 0,
        b19: 2,
        name: 'Вода питьевая 18,9 л',
        price: 600
      }
    ],
    courier: null,
    
    // Адрес и координаты
    address: 'мкр Самал-1, д. 15, кв. 25',
    fullAddress: 'г. Алматы, мкр Самал-1, дом 15, квартира 25, подъезд 2, этаж 5',
    deliveryCoordinates: {
      latitude: 43.2267,
      longitude: 76.8782
    },
    
    // Оплата
    paymentMethod: 'Наличные/Карта/QR',
    subtotal: 1200,
    deliveryFee: 0,
    totalAmount: 1200,
    isPaid: false,
    
    // Время
    deliveryTime: 'Сегодня, 14:00-16:00',
    estimatedDeliveryTime: '2025-01-01T15:00:00Z',
    
    // Дополнительная информация
    customerNotes: 'Позвонить за 10 минут до приезда',
    deliveryInstructions: 'Подъезд 2, домофон 25, 5 этаж',
    contactPhone: '+7 777 123 45 67',
    lastUpdated: '2025-01-01T10:30:00Z',
    
    trackingHistory: [
      {
        timestamp: '2025-01-01T10:30:00Z',
        status: 'created',
        message: 'Заказ создан',
      },
      {
        timestamp: '2025-01-01T10:35:00Z',
        status: 'confirmed',
        message: 'Заказ подтвержден',
      }
    ]
  },
  {
    id: 2,
    orderNumber: 'TW-2025-002',
    date: '2025-01-02',
    createdAt: '2025-01-02T11:15:00Z',
    status: "onTheWay" as const,
    products: [
      {
        b12: 1,
        b19: 1,
        name: 'Комбо: Вода 12,5л + 18,9л',
        price: 1800
      }
    ],
    courier: {
      id: 'courier_001',
      fullName: 'Айбек Жанысов',
      phone: '+7 701 234 56 78',
      rating: 4.8,
      vehicleType: 'car' as const,
      vehicleNumber: 'A 123 BC 02',
      estimatedArrival: '15:45'
    },
    
    // Адрес и координаты
    address: 'мкр Самал-2, д. 25',
    fullAddress: 'г. Алматы, мкр Самал-2, дом 25, квартира 12, подъезд 1, этаж 3',
    deliveryCoordinates: {
      latitude: 43.2156,
      longitude: 76.8934
    },
    courierLocation: {
      latitude: 43.2098,
      longitude: 76.8845
    },
    
    // Оплата
    paymentMethod: 'Банковская карта',
    subtotal: 1800,
    deliveryFee: 200,
    totalAmount: 2000,
    isPaid: true,
    
    // Время
    deliveryTime: 'Сегодня, 15:30-16:30',
    estimatedDeliveryTime: '2025-01-02T16:00:00Z',
    
    // Дополнительная информация
    customerNotes: 'Есть лифт',
    courierNotes: 'Клиент дома, можно звонить',
    deliveryInstructions: 'Подъезд 1, домофон 12, 3 этаж',
    contactPhone: '+7 777 987 65 43',
    lastUpdated: '2025-01-02T14:30:00Z',
    
    trackingHistory: [
      {
        timestamp: '2025-01-02T11:15:00Z',
        status: 'created',
        message: 'Заказ создан',
      },
      {
        timestamp: '2025-01-02T11:20:00Z',
        status: 'confirmed',
        message: 'Заказ подтвержден',
      },
      {
        timestamp: '2025-01-02T12:45:00Z',
        status: 'preparing',
        message: 'Заказ готовится к отправке',
        location: { latitude: 43.2220, longitude: 76.8512 }
      },
      {
        timestamp: '2025-01-02T14:30:00Z',
        status: 'onTheWay',
        message: 'Курьер выехал к вам',
        location: { latitude: 43.2220, longitude: 76.8512 }
      }
    ]
  },
  {
    id: 3,
    orderNumber: 'TW-2024-312',
    date: '2024-12-30',
    createdAt: '2024-12-30T09:20:00Z',
    status: "completed" as const,
    products: [
      {
        b12: 2,
        b19: 0,
        name: 'Вода питьевая 12,5 л',
        price: 1600
      }
    ],
    courier: {
      id: 'courier_002',
      fullName: 'Марат Сейтов',
      phone: '+7 708 345 67 89',
      rating: 4.9,
      vehicleType: 'car' as const,
      vehicleNumber: 'B 456 CD 02',
      estimatedArrival: '13:30'
    },
    
    // Адрес и координаты
    address: 'ул. Абая, д. 150',
    fullAddress: 'г. Алматы, ул. Абая, дом 150, квартира 45, подъезд 3, этаж 7',
    deliveryCoordinates: {
      latitude: 43.2418,
      longitude: 76.9562
    },
    
    // Оплата
    paymentMethod: 'Наличные',
    subtotal: 1600,
    deliveryFee: 200,
    totalAmount: 1800,
    isPaid: true,
    
    // Время
    deliveryTime: '30 декабря, 12:00-14:00',
    estimatedDeliveryTime: '2024-12-30T13:00:00Z',
    actualDeliveryTime: '2024-12-30T13:25:00Z',
    
    // Дополнительная информация
    customerNotes: 'Оставить у двери, если никого нет дома',
    courierNotes: 'Заказ доставлен вовремя, клиент остался доволен',
    deliveryInstructions: 'Подъезд 3, домофон 45, 7 этаж',
    contactPhone: '+7 777 555 44 33',
    lastUpdated: '2024-12-30T13:25:00Z',
    
    trackingHistory: [
      {
        timestamp: '2024-12-30T09:20:00Z',
        status: 'created',
        message: 'Заказ создан',
      },
      {
        timestamp: '2024-12-30T09:25:00Z',
        status: 'confirmed',
        message: 'Заказ подтвержден',
      },
      {
        timestamp: '2024-12-30T11:00:00Z',
        status: 'preparing',
        message: 'Заказ готовится к отправке',
      },
      {
        timestamp: '2024-12-30T12:30:00Z',
        status: 'onTheWay',
        message: 'Курьер выехал к вам',
        location: { latitude: 43.2220, longitude: 76.8512 }
      },
      {
        timestamp: '2024-12-30T13:25:00Z',
        status: 'completed',
        message: 'Заказ успешно доставлен',
        location: { latitude: 43.2418, longitude: 76.9562 }
      }
    ]
  }
]

const HistoryScreen: React.FC<HistoryScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header 
          bonus="50" 
          showBackButton={false}
        />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {orders.length === 0 && (
          <View style={styles.content}>
            <Text style={styles.title}>История заказов</Text>
            <Text style={styles.subtitle}>Здесь будет отображаться история ваших заказов</Text>
          </View>
        )}
        {orders.length > 0 && orders.map((order) => (
          <OrderBlock key={order.id} id={order.id} date={order.date} status={order.status} products={order.products} courier={order.courier} address={order.address} totalAmount={order.totalAmount} />
        ))}
      </ScrollView>
      <Navigation />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    padding: 24,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default HistoryScreen;
