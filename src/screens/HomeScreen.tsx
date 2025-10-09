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
import pushNotificationService from '../services/pushNotifications';

interface HomeScreenProps {}

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

          {/* <TouchableOpacity style={styles.button} onPress={() => {
            pushNotificationService.initialize();
            console.log('Тест');
          }}>
            <Text style={styles.buttonText}>Тест</Text>
          </TouchableOpacity> */}

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
      {/* <Navigation /> */}
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
