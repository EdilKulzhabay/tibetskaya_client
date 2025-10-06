import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  DeviceEventEmitter,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Header from '../components/Header';
import MainPageBanner from '../components/MainPageBanner';
import MainPageWallet from '../components/MainPageWallet';
import Products from '../components/Products';
import Marketplace from '../components/Marketplace';
import Navigation from '../components/Navigation';
import SpecialOffer from '../components/SpecialOffer';
import OrderBlock from '../components/OrderBlock';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../api/services';
const { tokenStorage } = require('../utils/storage');
import { useFocusEffect } from '@react-navigation/native';

interface HomeScreenProps {}

const activeOrders = 3;
// const orders: any[] = [];
// const orders = [
//   {
//     id: 1,
//     orderNumber: 'TW-2025-001',
//     date: '2025-01-01',
//     createdAt: '2025-01-01T10:30:00Z',
//     status: "awaitingOrder" as const,
//     products: [
//       {
//         b12: 0,
//         b19: 2,
//         name: 'Вода питьевая 18,9 л',
//         price: 600
//       }
//     ],
//     courier: null,
    
//     // Адрес и координаты
//     address: 'мкр Самал-1, д. 15, кв. 25',
//     fullAddress: 'г. Алматы, мкр Самал-1, дом 15, квартира 25, подъезд 2, этаж 5',
//     deliveryCoordinates: {
//       latitude: 43.2267,
//       longitude: 76.8782
//     },
    
//     // Оплата
//     paymentMethod: 'Наличные/Карта/QR',
//     subtotal: 1200,
//     deliveryFee: 0,
//     totalAmount: 1200,
//     isPaid: false,
    
//     // Время
//     deliveryTime: 'Сегодня, 14:00-16:00',
//     estimatedDeliveryTime: '2025-01-01T15:00:00Z',
    
//     // Дополнительная информация
//     customerNotes: 'Позвонить за 10 минут до приезда',
//     deliveryInstructions: 'Подъезд 2, домофон 25, 5 этаж',
//     contactPhone: '+7 777 123 45 67',
//     lastUpdated: '2025-01-01T10:30:00Z',
    
//     trackingHistory: [
//       {
//         timestamp: '2025-01-01T10:30:00Z',
//         status: 'created',
//         message: 'Заказ создан',
//       },
//       {
//         timestamp: '2025-01-01T10:35:00Z',
//         status: 'confirmed',
//         message: 'Заказ подтвержден',
//       }
//     ]
//   },
//   {
//     id: 2,
//     orderNumber: 'TW-2025-002',
//     date: '2025-01-02',
//     createdAt: '2025-01-02T11:15:00Z',
//     status: "onTheWay" as const,
//     products: [
//       {
//         b12: 1,
//         b19: 1,
//         name: 'Комбо: Вода 12,5л + 18,9л',
//         price: 1800
//       }
//     ],
//     courier: {
//       id: 'courier_001',
//       fullName: 'Айбек Жанысов',
//       phone: '+7 701 234 56 78',
//       rating: 4.8,
//       vehicleType: 'car' as const,
//       vehicleNumber: 'A 123 BC 02',
//       estimatedArrival: '15:45'
//     },
    
//     // Адрес и координаты
//     address: 'мкр Самал-2, д. 25',
//     fullAddress: 'г. Алматы, мкр Самал-2, дом 25, квартира 12, подъезд 1, этаж 3',
//     deliveryCoordinates: {
//       latitude: 43.2156,
//       longitude: 76.8934
//     },
//     courierLocation: {
//       latitude: 43.2098,
//       longitude: 76.8845
//     },
    
//     // Оплата
//     paymentMethod: 'Банковская карта',
//     subtotal: 1800,
//     deliveryFee: 200,
//     totalAmount: 2000,
//     isPaid: true,
    
//     // Время
//     deliveryTime: 'Сегодня, 15:30-16:30',
//     estimatedDeliveryTime: '2025-01-02T16:00:00Z',
    
//     // Дополнительная информация
//     customerNotes: 'Есть лифт',
//     courierNotes: 'Клиент дома, можно звонить',
//     deliveryInstructions: 'Подъезд 1, домофон 12, 3 этаж',
//     contactPhone: '+7 777 987 65 43',
//     lastUpdated: '2025-01-02T14:30:00Z',
    
//     trackingHistory: [
//       {
//         timestamp: '2025-01-02T11:15:00Z',
//         status: 'created',
//         message: 'Заказ создан',
//       },
//       {
//         timestamp: '2025-01-02T11:20:00Z',
//         status: 'confirmed',
//         message: 'Заказ подтвержден',
//       },
//       {
//         timestamp: '2025-01-02T12:45:00Z',
//         status: 'preparing',
//         message: 'Заказ готовится к отправке',
//         location: { latitude: 43.2220, longitude: 76.8512 }
//       },
//       {
//         timestamp: '2025-01-02T14:30:00Z',
//         status: 'onTheWay',
//         message: 'Курьер выехал к вам',
//         location: { latitude: 43.2220, longitude: 76.8512 }
//       }
//     ]
//   },
//   {
//     id: 3,
//     orderNumber: 'TW-2024-312',
//     date: '2024-12-30',
//     createdAt: '2024-12-30T09:20:00Z',
//     status: "delivered" as const,
//     products: [
//       {
//         b12: 2,
//         b19: 0,
//         name: 'Вода питьевая 12,5 л',
//         price: 1600
//       }
//     ],
//     courier: {
//       id: 'courier_002',
//       fullName: 'Марат Сейтов',
//       phone: '+7 708 345 67 89',
//       rating: 4.9,
//       vehicleType: 'car' as const,
//       vehicleNumber: 'B 456 CD 02',
//       estimatedArrival: '13:30'
//     },
    
//     // Адрес и координаты
//     address: 'ул. Абая, д. 150',
//     fullAddress: 'г. Алматы, ул. Абая, дом 150, квартира 45, подъезд 3, этаж 7',
//     deliveryCoordinates: {
//       latitude: 43.2418,
//       longitude: 76.9562
//     },
    
//     // Оплата
//     paymentMethod: 'Наличные',
//     subtotal: 1600,
//     deliveryFee: 200,
//     totalAmount: 1800,
//     isPaid: true,
    
//     // Время
//     deliveryTime: '30 декабря, 12:00-14:00',
//     estimatedDeliveryTime: '2024-12-30T13:00:00Z',
//     actualDeliveryTime: '2024-12-30T13:25:00Z',
    
//     // Дополнительная информация
//     customerNotes: 'Оставить у двери, если никого нет дома',
//     courierNotes: 'Заказ доставлен вовремя, клиент остался доволен',
//     deliveryInstructions: 'Подъезд 3, домофон 45, 7 этаж',
//     contactPhone: '+7 777 555 44 33',
//     lastUpdated: '2024-12-30T13:25:00Z',
    
//     trackingHistory: [
//       {
//         timestamp: '2024-12-30T09:20:00Z',
//         status: 'created',
//         message: 'Заказ создан',
//       },
//       {
//         timestamp: '2024-12-30T09:25:00Z',
//         status: 'confirmed',
//         message: 'Заказ подтвержден',
//       },
//       {
//         timestamp: '2024-12-30T11:00:00Z',
//         status: 'preparing',
//         message: 'Заказ готовится к отправке',
//       },
//       {
//         timestamp: '2024-12-30T12:30:00Z',
//         status: 'onTheWay',
//         message: 'Курьер выехал к вам',
//         location: { latitude: 43.2220, longitude: 76.8512 }
//       },
//       {
//         timestamp: '2024-12-30T13:25:00Z',
//         status: 'delivered',
//         message: 'Заказ успешно доставлен',
//         location: { latitude: 43.2418, longitude: 76.9562 }
//       }
//     ]
//   }
// ]

const HomeScreen: React.FC<HomeScreenProps> = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, loadingState } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    tokenStorage.getAuthToken().then((token: any) => {
      setToken(token);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Запрашиваем активные заказы только один раз при загрузке экрана
      if (user?.mail && loadingState === 'success' && orders.length === 0) {
        console.log('Запрашиваем активные заказы для:', user.mail);
        apiService.getActiveOrders(user.mail).then((res: any) => {
          setOrders(res.orders);
        }).catch((error) => {
          console.error('Ошибка при получении активных заказов:', error);
        });
      }
    }, [user?.mail, loadingState, orders.length])
  );

  // Подписка на обновления статусов заказов
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'orderStatusUpdated',
      ({ orderId, newStatus, orderData }) => {
        console.log('🔄 HomeScreen: Получено обновление заказа:', orderId, newStatus);
        
        // Обновляем состояние заказов
        setOrders(prevOrders => {
          const orderExists = prevOrders.some(order => order._id === orderId);
          
          if (orderExists) {
            // Обновляем существующий заказ
            return prevOrders.map(order =>
              order._id === orderId
                ? { ...order, status: newStatus, updatedAt: orderData.updatedAt }
                : order
            );
          } else {
            // Добавляем новый заказ в начало списка
            return [orderData, ...prevOrders];
          }
        });
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        <Header bonus="50" />
        <View style={styles.content}>
          <MainPageBanner navigation={navigation} setIsModalVisible={setIsModalVisible} />

          {orders.length > 0 && (
            <View style={styles.activeOrdersContainer}>
              <View style={styles.activeOrdersTitle}>
                <Text style={styles.activeOrdersTitleText}>Активные заказы ({orders.length})</Text>
                <TouchableOpacity style={styles.activeOrdersTitleButton}>
                  <Text style={styles.activeOrdersTitleButtonText}>Все заказы</Text>
                </TouchableOpacity>
              </View>
              {orders.length > 0 && orders.map((order, index) => (
                <OrderBlock 
                  key={order._id || index} 
                  _id={order.id} 
                  date={order.date.d} 
                  status={order.status} 
                  products={order.products} 
                  courier={order?.courier}
                  address={order.address}
                  // paymentMethod={order.paymentMethod}
                  // deliveryTime={order.deliveryTime}
                  totalAmount={order.totalAmount}
                  courierAggregator={order.courierAggregator}
                  // courierLocation={order.courierLocation}
                />
              ))}
            </View>
          )}

          <MainPageWallet balance={user?.balance || 0} />
          <Products navigation={navigation} />
          <Marketplace />
          
        </View>
        <View style={styles.specialOfferContainer}>
          <SpecialOffer navigation={navigation} />
        </View>
      </ScrollView>
      <Navigation />
      <Modal
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
        transparent={true}
        animationType="slide"
      >
        <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setIsModalVisible(false)}
        >
            <TouchableOpacity 
                style={styles.modalContainer} 
                activeOpacity={1} 
                onPress={(e) => e.stopPropagation()}
            >
                <Text style={{ fontSize: 24, fontWeight: "700"}}>Вызов мастера на дом:</Text>

                <View style={{height: 1, backgroundColor: "#EDEDED", marginVertical: 16}} />

                <Text style={{ fontSize: 18, fontWeight: "600", textAlign: "center"}}>Вызовите мастера и он устранит проблему</Text>

                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttonText}>Позвонить</Text>
                </TouchableOpacity>
            </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    paddingBottom: 20,
  },
  content: {
    paddingHorizontal: 16,
  },
  specialOfferContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#DC1818',
    padding: 16,
    borderRadius: 8,
    marginTop: 32,
  },
  buttonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
  },
  activeOrdersContainer: {
    marginTop: 24,
  },
  activeOrdersTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeOrdersTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101010',
  },
  activeOrdersTitleButton: {
    padding: 3
  },
  activeOrdersTitleButtonText: {
    color: '#DC1818',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: "relative"
  },
  modalContainer: {
      backgroundColor: 'white',
      padding: 24,
      borderRadius: 8,
      position: "absolute",
      bottom: 0,
      width: "100%",
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      paddingBottom: 40,
  },
});

export default HomeScreen;
