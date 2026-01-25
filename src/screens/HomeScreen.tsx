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
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Header from '../components/Header';
import MainPageBanner from '../components/MainPageBanner';
import Products from '../components/Products';
import SpecialOffer from '../components/SpecialOffer';
import OrderBlock from '../components/OrderBlock';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../api/services';
const { tokenStorage } = require('../utils/storage');
import { useFocusEffect } from '@react-navigation/native';

interface HomeScreenProps {}

const HomeScreen: React.FC<HomeScreenProps> = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, loadingState, refreshUserData } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [notEnoughBalanceModalVisible, setNotEnoughBalanceModalVisible] = useState(false);

  useEffect(() => {
    tokenStorage.getAuthToken().then((token: any) => {
      setToken(token);
    });
  }, []);

  // Очистка заказов при выходе из системы
  useFocusEffect(
    useCallback(() => {
      if (!user) {
        console.log('Пользователь вышел из системы - очищаем заказы');
        setOrders([]);
      }
    }, [user])
  );

  useFocusEffect(
    useCallback(() => {
      // Запрашиваем активные заказы каждый раз при переходе на экран
      if (user?.mail) {
        getLastOrder();
        refreshUserData();
        apiService.getActiveOrders(user.mail).then((res: any) => {
          setOrders(res.orders);
        }).catch((error) => {
          console.error('Ошибка при получении активных заказов:', error);
        });
      }
    }, [user?.mail])
  );

  const getLastOrder = async () => {
    if (user?.mail) {
      const lastOrder = await apiService.getLastOrder(user.mail);
      console.log('lastOrder', lastOrder);
      if (lastOrder.success) {
        setLastOrder(lastOrder.order);
      } else {
        setLastOrder(null);
      }
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (user?.mail && loadingState === 'success') {
        
        refreshUserData();
      }
    }, [refreshUserData])
  );

  // Подписка на обновления статусов заказов
  useEffect(() => {
    let isMounted = true;
    
    const subscription = DeviceEventEmitter.addListener(
      'orderStatusUpdated',
      async ({ orderId, newStatus }) => {
        // Проверяем, что компонент все еще смонтирован
        if (!isMounted) {
          return;
        }
        
        // Проверяем наличие обязательных данных
        if (!orderId || !newStatus) {
          console.warn('⚠️ HomeScreen: Неполные данные обновления заказа:', { orderId, newStatus });
          return;
        }

        const fetchOrder = async () => {
          const orderData = await apiService.getOrder(orderId);
          return orderData.order;
        }
        const orderData = await fetchOrder();
        if (!orderData) {
          console.warn('⚠️ HomeScreen: Не удалось получить данные заказа:', orderId);
          return;
        }

        // Обновляем состояние заказов
        setOrders(prevOrders => {
          
          // Защита от null/undefined
          if (!prevOrders || !Array.isArray(prevOrders)) {
            console.warn('⚠️ HomeScreen: prevOrders не является массивом');
            return orderData ? [orderData] : [];
          }
          
          const orderExists = prevOrders.some(order => order && order._id === orderId);
          
          if (orderExists) {
            // Обновляем существующий заказ
            return prevOrders.map(order => {
              if (!order) return order;
              return order._id === orderId
                ? { ...order, courierAggregator: orderData?.courierAggregator, status: newStatus, updatedAt: orderData?.updatedAt || new Date().toISOString() }
                : order;
            });
          } else {
            // Добавляем новый заказ в начало списка
            return orderData ? [orderData, ...prevOrders] : prevOrders;
          }
        });
      }
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);


  const reloadOrder = async () => {
    if (user?.mail && lastOrder) {
      // Определяем сегодняшнюю дату и время
      const now = new Date();
      let orderDate = new Date(now);

      const dayOfWeek = now.getDay(); // 0 - воскресенье, 6 - суббота
      const hours = now.getHours();

      const pad = (n: number) => n.toString().padStart(2, '0');

      // Проверяем условия: до 19:00 и не воскресенье
      if (dayOfWeek !== 0 && hours < 19) {
        // Сегодняшний день, не воскресенье, и время до 19:00
        // orderDate остается сегодняшним
      } else {
        // Следующий рабочий день (не воскресенье)
        // Если сегодня суббота и уже поздно, следующий не воскресенье -> понедельник
        orderDate.setDate(orderDate.getDate() + 1);
        let nextDay = orderDate.getDay();
        // Если это воскресенье, добавляем еще 1 день (на понедельник)
        if (nextDay === 0) {
          orderDate.setDate(orderDate.getDate() + 1);
        }
      }

      // Формируем дату в формате ГГГГ-ММ-ДД
      const formattedOrderDate = `${orderDate.getFullYear()}-${pad(orderDate.getMonth()+1)}-${pad(orderDate.getDate())}`;
      const orderDateObject = {d: formattedOrderDate, time: ""};
      const res = await apiService.addOrder(user.mail, lastOrder.address, lastOrder.products, lastOrder.clientNotes, orderDateObject, selectedPayment?.value, lastOrder.needCall, lastOrder.comment);
      if (res.success) {
        Alert.alert('Успешно', 'Заказ повторно оформлен');
        setPaymentModalVisible(false);
        refreshUserData();
      } else {
        Alert.alert('Ошибка', res.message);
      }
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        <Header bonus={user?.balance || 0} paymentMethod={user?.paymentMethod || 'balance'} coupon={user?.paidBootles || 0} showBonus={true} />
        <View style={styles.content}>
          <MainPageBanner navigation={navigation} setIsModalVisible={setIsModalVisible} />

          {lastOrder && (
            <TouchableOpacity
              onPress={() => {
                console.log('user?.balance', user?.balance);
                console.log('lastOrder?.sum', lastOrder?.sum);
                if (user?.paymentMethod === 'balance' && user?.balance !== undefined && user?.balance !== null && user?.balance < lastOrder?.sum) {
                  setNotEnoughBalanceModalVisible(true);
                } else if (user?.paymentMethod === 'coupon' && user?.paidBootles !== undefined && user?.paidBootles !== null && user?.paidBootles < lastOrder?.products.b12 + lastOrder?.products.b19) {
                  setNotEnoughBalanceModalVisible(true);
                } else {
                  setPaymentModalVisible(true);
                }
              }}
              style={{
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                backgroundColor: "white", 
                padding: 16, 
                borderRadius: 16, 
                marginTop: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5}}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <Image source={require('../assets/repeat.png')} style={{width: 40, height: 40, borderRadius: 10}} />
                <View>
                  <Text style={{fontSize: 14, fontWeight: '600'}}>Повторить{'\n'}последний заказ</Text>
                  <Text style={{fontSize: 12, fontWeight: '500', color: '#545454'}}>
                    {lastOrder.products.b12 > 0 ? `${lastOrder.products.b12}x Вода 12,5 л` : ''}{lastOrder.products.b12 > 0 && lastOrder.products.b19 > 0 ? ', ' : ''}{lastOrder.products.b19 > 0 ? `${lastOrder.products.b19}x Вода 18,9л.` : ''}
                  </Text>
                  <Text style={{fontSize: 12, fontWeight: '500', color: '#545454'}}>{lastOrder.address.name}</Text>
                </View>
              </View>
              <View style={{backgroundColor: 'white', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E3E3E3'}}>
                <Text style={{color: '#DC1818', fontSize: 14, fontWeight: '600'}}>Повторить</Text>
              </View>
            </TouchableOpacity>
          )}

          {orders.length > 0 && (
            <View style={styles.activeOrdersContainer}>
              <View style={styles.activeOrdersTitle}>
                <Text style={styles.activeOrdersTitleText}>Активные заказы ({orders.length})</Text>
                {/* <TouchableOpacity style={styles.activeOrdersTitleButton}>
                  <Text style={styles.activeOrdersTitleButtonText}>Все заказы</Text>
                </TouchableOpacity> */}
              </View>
              {orders.length > 0 && orders.map((order, index) => (
                <OrderBlock 
                  key={order._id || index} 
                  _id={order._id} 
                  date={order.date} 
                  status={order.status} 
                  products={order.products} 
                  courier={order?.courier}
                  address={order.address}
                  // paymentMethod={order.paymentMethod}
                  // deliveryTime={order.deliveryTime}
                  totalAmount={order.sum}
                  courierAggregator={order.courierAggregator}
                  // courierLocation={order.courierLocation}
                />
              ))}
            </View>
          )}

          {/* <MainPageWallet balance={user?.balance || 0} /> */}
          <Products navigation={navigation} />
          {/* <Marketplace /> */}
          <Image 
            source={require('../assets/marketPlace.png')} 
            style={{ 
              width: '100%', 
              resizeMode: 'contain', 
              marginBottom: -56, 
              marginTop: -32,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            }} 
            resizeMode="contain"
          />
          
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
      <Modal
          visible={paymentModalVisible}
          onRequestClose={() => setPaymentModalVisible(false)}
          transparent={true}
          animationType="fade"
      >
          <TouchableOpacity style={styles.modalOverlayReloadOrder} onPress={() => setPaymentModalVisible(false)}>
              <TouchableOpacity style={styles.modalContainerReloadOrder} onPress={(e) => e.stopPropagation()}>
                  <Text style={{fontSize: 24, fontWeight: '600', color: '#101010', marginBottom: 16, textAlign: 'center'}}>Способ оплаты</Text>
                      <TouchableOpacity style={styles.modalAddress} onPress={() => {
                          if (selectedPayment?.value === 'fakt') {
                              setSelectedPayment(null);
                          } else {
                              setSelectedPayment({ label: 'Наличными', value: 'fakt' });
                          }
                      }}>
                          <Text style={styles.modalAddressText}>Наличными</Text>
                          <View style={{ justifyContent: 'center', alignItems: 'center', width: 16, height: 16, borderRadius: "50%", borderWidth: 1, borderColor: selectedPayment?.value === "fakt" ? '#DC1818' : '#101010' }}>
                              {selectedPayment?.value === "fakt" && <View style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: '#DC1818' }} />}
                          </View>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.modalAddress} onPress={() => {
                          if (selectedPayment?.value === 'card') {
                              setSelectedPayment(null);
                          } else {
                              setSelectedPayment({ label: 'С баланса', value: 'card' });
                          }
                      }}>
                          {user && user?.paymentMethod === "coupon" ? (
                              <Text style={styles.modalAddressText}>
                                  С баланса <Text style={{color: "#46a54f"}}>({Number(user?.paidBootles || 0).toLocaleString("ru-RU")} шт)</Text>
                              </Text>
                          ) : (
                              <Text style={styles.modalAddressText}>
                                  С баланса <Text style={{color: "#46a54f"}}>({Number(user?.balance || 0).toLocaleString("ru-RU")} ₸)</Text>
                              </Text>
                          )}
                          <View style={{ justifyContent: 'center', alignItems: 'center', width: 16, height: 16, borderRadius: "50%", borderWidth: 1, borderColor: selectedPayment?.value === "card" ? '#DC1818' : '#101010' }}>
                              {selectedPayment?.value === "card" && <View style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: '#DC1818' }} />}
                          </View>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.button} onPress={() => {
                          reloadOrder();
                      }}>
                          <Text style={styles.buttonText}>Подтвердить</Text>
                      </TouchableOpacity>
              </TouchableOpacity>
          </TouchableOpacity>
      </Modal>
      <Modal
          visible={notEnoughBalanceModalVisible}
          onRequestClose={() => setNotEnoughBalanceModalVisible(false)}
          transparent={true}
          animationType="fade"
      >
          <TouchableOpacity style={styles.modalOverlayReloadOrder} onPress={() => setNotEnoughBalanceModalVisible(false)}>
              <TouchableOpacity style={styles.modalContainerReloadOrder} onPress={(e) => e.stopPropagation()}>
                  <Image source={require('../assets/wallet.png')} style={{width: 60, height: 60, marginBottom: 12, alignSelf: 'center'}} />
                  {user?.paymentMethod === "balance" ? (
                      <>
                          <Text style={{fontSize: 20, fontWeight: '600', color: '#101010', marginBottom: 12, textAlign: 'center'}}>Не хватает {lastOrder?.sum - (user?.balance || 0)} ₸</Text>
                          <Text style={{fontSize: 14, fontWeight: '500', color: '#101010', textAlign: 'center'}}>Ваш текущий баланс: {user?.balance || 0} ₸.</Text>
                          <Text style={{fontSize: 14, fontWeight: '500', color: '#101010', textAlign: 'center'}}>Для оформления заказа необходимо пополнить счет.</Text>
                      </>
                  ) : (
                      <>
                          <Text style={{fontSize: 20, fontWeight: '600', color: '#101010', marginBottom: 12, textAlign: 'center'}}>Не хватает {lastOrder?.products.b12 + lastOrder?.products.b19 - (user?.paidBootles || 0)} шт</Text>
                          <Text style={{fontSize: 14, fontWeight: '500', color: '#101010', textAlign: 'center'}}>Ваш текущий баланс: {user?.paidBootles || 0} шт.</Text>
                          <Text style={{fontSize: 14, fontWeight: '500', color: '#101010', textAlign: 'center'}}>Для оформления заказа необходимо пополнить баланс.</Text>
                      </>
                  )}
                  {/* <Text style={{fontSize: 20, fontWeight: '600', color: '#101010', marginBottom: 12, textAlign: 'center'}}>Не хватает {count12 * price12 + count19 * price19 - (user?.balance || 0)} ₸</Text>
                  <Text style={{fontSize: 14, fontWeight: '500', color: '#101010', textAlign: 'center'}}>Ваш текущий баланс: {user?.balance || 0} ₸.</Text>
                  <Text style={{fontSize: 14, fontWeight: '500', color: '#101010', textAlign: 'center'}}>Для оформления заказа необходимо пополнить счет.</Text> */}
                  <TouchableOpacity 
                      style={{
                          backgroundColor: '#0d74d0',
                          padding: 16,
                          borderRadius: 8,
                          marginTop: 40,
                      }} 
                      onPress={() => {
                          setNotEnoughBalanceModalVisible(false)
                          setSelectedPayment(null)
                          navigation.navigate('Wallet')
                      }
                  }>
                      {user?.paymentMethod === "balance" ? (
                          <Text style={styles.buttonText}>Пополнить на {lastOrder?.sum - (user?.balance || 0)} ₸</Text>
                      ) : (
                          <Text style={styles.buttonText}>Пополнить на {lastOrder?.products.b12 + lastOrder?.products.b19 - (user?.paidBootles || 0)} шт</Text>
                      )}
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, {marginTop: 10}]} onPress={() => {
                      setNotEnoughBalanceModalVisible(false)
                      setSelectedPayment({ label: 'Наличными', value: 'fakt' })
                      reloadOrder();
                  }}>
                      <Text style={styles.modalButtonText}>Оплатить наличными</Text>
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
  modalOverlayReloadOrder: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainerReloadOrder: {
      backgroundColor: 'white',
      padding: 24,
      borderRadius: 8,
      width: '80%',
  },
  modalAddress: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EDEDED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalAddressText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#101010',
  },
  modalButton: {
    padding: 16,
    borderRadius: 8,
  },
  modalButtonText: {
      color: '#0d74d0',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
  },
});

export default HomeScreen;
