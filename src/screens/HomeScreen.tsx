import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  Platform,
  ActivityIndicator,
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
import { useTopUpBalance } from '../context/TopUpBalanceContext';

interface HomeScreenProps {}

const HomeScreen: React.FC<HomeScreenProps> = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, loadingState, refreshUserData } = useAuth();
  const { openTopUpModal } = useTopUpBalance();
  const [token, setToken] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [notEnoughBalanceModalVisible, setNotEnoughBalanceModalVisible] = useState(false);
  const [masterCallConfirmModalVisible, setMasterCallConfirmModalVisible] = useState(false);
  const [masterCallSuccessModalVisible, setMasterCallSuccessModalVisible] = useState(false);
  const [masterCallLoading, setMasterCallLoading] = useState(false);

  const platformSentRef = useRef(false);

  useEffect(() => {
    tokenStorage.getAuthToken().then((token: any) => {
      setToken(token);
    });
  }, []);

  useEffect(() => {
    if (user?.mail && !platformSentRef.current) {
      platformSentRef.current = true;
      apiService.updateData(user.mail, 'platform', Platform.OS);
      const APP_VERSION = "1.1.0";
      apiService.updateData(user.mail, 'appVersion', APP_VERSION.toString());
    }
  }, [user?.mail]);

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

  const openMasterCallConfirmModal = () => {
    if (!user?.mail) {
      Alert.alert('Вход в аккаунт', 'Войдите в аккаунт, чтобы вызвать мастера');
      return;
    }
    const fullName = user.userName?.trim() || (user as { fullName?: string }).fullName?.trim() || '';
    const phone = user.phone?.trim() || '';
    if (!fullName || !phone) {
      Alert.alert(
        'Данные профиля',
        'Укажите имя и телефон в разделе «Мои данные».',
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Перейти', onPress: () => navigation.navigate('ChangeData') },
        ]
      );
      return;
    }
    setMasterCallConfirmModalVisible(true);
  };

  const handleRequestMasterCall = async () => {
    if (!user?.mail) {
      Alert.alert('Вход в аккаунт', 'Войдите в аккаунт, чтобы вызвать мастера');
      return;
    }
    const fullName = user.userName?.trim() || (user as { fullName?: string }).fullName?.trim() || '';
    const phone = user.phone?.trim() || '';
    if (!fullName || !phone) {
      setMasterCallConfirmModalVisible(false);
      Alert.alert(
        'Данные профиля',
        'Укажите имя и телефон в разделе «Мои данные».',
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Перейти', onPress: () => navigation.navigate('ChangeData') },
        ]
      );
      return;
    }
    setMasterCallLoading(true);
    try {
      const res = await apiService.requestMasterCall({ fullName, phone, mail: user?.mail || '' });
      if (res?.success) {
        setMasterCallConfirmModalVisible(false);
        setMasterCallSuccessModalVisible(true);
      } else {
        Alert.alert('Ошибка', (res as { message?: string })?.message || 'Не удалось отправить заявку');
      }
    } catch {
      Alert.alert('Ошибка', 'Не удалось отправить заявку');
    } finally {
      setMasterCallLoading(false);
    }
  };

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


  const getNextDeliveryDate = () => {
    const now = new Date();
    let orderDate = new Date(now);
    const dayOfWeek = now.getDay();
    const hours = now.getHours();

    if (dayOfWeek !== 0 && hours < 19) {
      // Будний день / суббота до 19:00 — сегодня
    } else {
      orderDate.setDate(orderDate.getDate() + 1);
      if (orderDate.getDay() === 0) {
        orderDate.setDate(orderDate.getDate() + 1);
      }
    }
    return orderDate;
  };

  const getOrderAcceptText = () => {
    const now = new Date();
    const orderDate = getNextDeliveryDate();
    const dayOfWeek = now.getDay();
    const hours = now.getHours();

    const dayNames = ['воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'];

    const isToday =
      orderDate.getDate() === now.getDate() &&
      orderDate.getMonth() === now.getMonth() &&
      orderDate.getFullYear() === now.getFullYear();

    if (isToday) {
      return 'Заказ принят на сегодня';
    }

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow =
      orderDate.getDate() === tomorrow.getDate() &&
      orderDate.getMonth() === tomorrow.getMonth() &&
      orderDate.getFullYear() === tomorrow.getFullYear();

    if (isTomorrow) {
      return 'Заказ принят на завтра';
    }

    return `Заказ принят на ${dayNames[orderDate.getDay()]}`;
  };

  const reloadOrder = async (paymentOverride?: string) => {
    const paymentValue = paymentOverride || selectedPayment?.value;
    if (user?.mail && lastOrder) {
      if (paymentValue === 'card' || paymentValue === 'credit' || paymentValue === 'coupon') {
        if (user?.paymentMethod === 'balance') {
          if (user?.balance !== undefined && user.balance < lastOrder.sum) {
            setPaymentModalVisible(false);
            setNotEnoughBalanceModalVisible(true);
            return;
          }
        } else if (user?.paymentMethod === 'coupon') {
          const needed19 = lastOrder?.products?.b19 || 0;
          const needed12 = lastOrder?.products?.b12 || 0;
          if (needed19 > (user?.paidBootlesFor19 || 0) || needed12 > (user?.paidBootlesFor12 || 0)) {
            setPaymentModalVisible(false);
            setNotEnoughBalanceModalVisible(true);
            return;
          }
        }
      }

      const orderDate = getNextDeliveryDate();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const formattedOrderDate = `${orderDate.getFullYear()}-${pad(orderDate.getMonth()+1)}-${pad(orderDate.getDate())}`;
      const orderDateObject = {d: formattedOrderDate, time: ""};
      const res = await apiService.addOrder(user.mail, lastOrder.address, lastOrder.products, lastOrder.clientNotes, orderDateObject, paymentValue, lastOrder.needCall, lastOrder.comment);
      if (res.success) {
        Alert.alert('Успешно', getOrderAcceptText());
        setPaymentModalVisible(false);
        setNotEnoughBalanceModalVisible(false);
        refreshUserData();
      } else {
        Alert.alert('Ошибка', res.message);
      }
    }
  }

  const showRepairMasterBlock =
    !!user && user.showRepairMasterInApp === true;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        <Header 
          bonus={user?.balance || 0} 
          paymentMethod={user?.paymentMethod || 'balance'} 
          coupon={user?.paidBootles || 0} 
          paidBootlesFor19={user?.paidBootlesFor19 || 0}
          paidBootlesFor12={user?.paidBootlesFor12 || 0}
          doesItTake19Bottles={user?.doesItTake19Bottles}
          doesItTake12Bottles={user?.doesItTake12Bottles}
          showBonus={true}
          onBonusPress={openTopUpModal}
        />
        <View style={styles.content}>
          <MainPageBanner navigation={navigation} setIsModalVisible={setIsModalVisible} />

          {lastOrder && (
            <TouchableOpacity
              onPress={() => {
                console.log('user?.balance', user?.balance);
                console.log('lastOrder?.sum', lastOrder?.sum);
                if (user?.paymentMethod === 'balance' && user?.balance !== undefined && user?.balance !== null && user?.balance < lastOrder?.sum) {
                  setNotEnoughBalanceModalVisible(true);
                } else if (user?.paymentMethod === 'coupon') {
                  // Проверяем баланс бутылок раздельно для 19л и 12л
                  const needed19 = lastOrder?.products?.b19 || 0;
                  const needed12 = lastOrder?.products?.b12 || 0;
                  const available19 = user?.paidBootlesFor19 || 0;
                  const available12 = user?.paidBootlesFor12 || 0;
                  
                  if (needed19 > available19 || needed12 > available12) {
                    setNotEnoughBalanceModalVisible(true);
                  } else {
                    setPaymentModalVisible(true);
                  }
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
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                ...(showRepairMasterBlock ? {} : {
                  borderBottomLeftRadius: 16,
                  borderBottomRightRadius: 16,
                }),
                marginTop: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5}}>
              <View style={{flexDirection: 'row', maxWidth: '50%', alignItems: 'center', gap: 8}}>
                <Image source={require('../assets/repeat.png')} style={{width: 40, height: 40, borderRadius: 10}} />
                <View>
                  <View>
                    <Text style={{fontSize: 14, fontWeight: '600'}}>Повторить{'\n'}последний заказ</Text>
                    <Text style={{fontSize: 12, fontWeight: '500', color: '#545454'}}>
                      {lastOrder.products.b12 > 0 ? `${lastOrder.products.b12}x Вода 12,5 л` : ''}{lastOrder.products.b12 > 0 && lastOrder.products.b19 > 0 ? `\n` : ''}{lastOrder.products.b19 > 0 ? `${lastOrder.products.b19}x Вода 18,9л.` : ''}
                    </Text>
                  </View>
                  <View style={{flexDirection: "row", gap: 6, marginTop: 4, alignItems: 'center'}}>
                    <Image source={require('../assets/pin.png')} style={{width: 16, height: 16}} />
                    <Text style={{fontSize: 12, fontWeight: '500', color: '#545454'}}>{lastOrder.address.name}</Text>
                  </View>
                </View>
              </View>
              <View style={{backgroundColor: 'white', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E3E3E3'}}>
                <Text style={{color: '#DC1818', fontSize: 14, fontWeight: '600'}}>Повторить</Text>
              </View>
            </TouchableOpacity>
          )}

          {showRepairMasterBlock && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#e6e6e6',
              padding: 16,
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              marginTop: 6,
              borderWidth: 1,
              borderColor: '#cdcdcd',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                gap: 4,
                alignItems: 'center',
              }}
            >
              <Image source={require('../assets/mainFix.png')} style={{width: 32, height: 32}} />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: '#DC1818',
                }}
              >Ремонт техники</Text>

            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#DC1818',
                paddingHorizontal: 8,
                paddingVertical: 8,
                borderRadius: 10,
                minWidth: 130,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: masterCallLoading ? 0.7 : 1,
              }}
              onPress={openMasterCallConfirmModal}
              disabled={masterCallLoading}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: 'white',
              }}>Вызвать мастера</Text>
            </TouchableOpacity>
            
          </View>
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
                  opForm={order.opForm || 'fakt'}
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
          <Products navigation={navigation} price19={user?.price19 || 1300} price12={user?.price12 || 900} />
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
                          <View style={{ justifyContent: 'center', alignItems: 'center', width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: selectedPayment?.value === "fakt" ? '#DC1818' : '#101010' }}>
                              {selectedPayment?.value === "fakt" && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#DC1818' }} />}
                          </View>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.modalAddress} onPress={() => {
                          // Определяем правильное значение opForm в зависимости от paymentMethod пользователя
                          const balanceValue = user?.paymentMethod === "coupon" ? 'coupon' : 'credit';
                          if (selectedPayment?.value === balanceValue) {
                              setSelectedPayment(null);
                          } else {
                              setSelectedPayment({ label: 'С баланса', value: balanceValue });
                          }
                      }}>
                          {user && user?.paymentMethod === "coupon" ? (
                              <View>
                                  <Text style={styles.modalAddressText}>С баланса</Text>
                                  {user?.doesItTake19Bottles && user?.doesItTake12Bottles ? (
                                      <Text style={{color: "#46a54f", fontSize: 12, marginTop: 4}}>
                                          ({user?.paidBootlesFor19 || 0} шт 18,9л, {user?.paidBootlesFor12 || 0} шт 12,5л)
                                      </Text>
                                  ) : user?.doesItTake19Bottles ? (
                                      <Text style={{color: "#46a54f", fontSize: 12, marginTop: 4}}>
                                          ({user?.paidBootlesFor19 || 0} шт 18,9л)
                                      </Text>
                                  ) : user?.doesItTake12Bottles ? (
                                      <Text style={{color: "#46a54f", fontSize: 12, marginTop: 4}}>
                                          ({user?.paidBootlesFor12 || 0} шт 12,5л)
                                      </Text>
                                  ) : (
                                      <Text style={{color: "#46a54f", fontSize: 12, marginTop: 4}}>
                                          ({(user?.paidBootlesFor19 || 0) + (user?.paidBootlesFor12 || 0)} шт)
                                      </Text>
                                  )}
                              </View>
                          ) : (
                              <Text style={styles.modalAddressText}>
                                  С баланса <Text style={{color: "#46a54f"}}>({Number(user?.balance || 0).toLocaleString("ru-RU")} ₸)</Text>
                              </Text>
                          )}
                          <View style={{ justifyContent: 'center', alignItems: 'center', width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: (selectedPayment?.value === "credit" || selectedPayment?.value === "coupon") ? '#DC1818' : '#101010' }}>
                              {(selectedPayment?.value === "credit" || selectedPayment?.value === "coupon") && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#DC1818' }} />}
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
                          <Text style={{fontSize: 20, fontWeight: '600', color: '#101010', marginBottom: 12, textAlign: 'center'}}>Недостаточно бутылок</Text>
                          {(lastOrder?.products?.b19 || 0) > (user?.paidBootlesFor19 || 0) && (
                              <Text style={{fontSize: 14, fontWeight: '500', color: '#101010', textAlign: 'center'}}>
                                  18,9л: нужно {lastOrder?.products?.b19 || 0}, у вас {user?.paidBootlesFor19 || 0} шт
                              </Text>
                          )}
                          {(lastOrder?.products?.b12 || 0) > (user?.paidBootlesFor12 || 0) && (
                              <Text style={{fontSize: 14, fontWeight: '500', color: '#101010', textAlign: 'center'}}>
                                  12,5л: нужно {lastOrder?.products?.b12 || 0}, у вас {user?.paidBootlesFor12 || 0} шт
                              </Text>
                          )}
                          <Text style={{fontSize: 14, fontWeight: '500', color: '#101010', textAlign: 'center', marginTop: 8}}>Для оформления заказа необходимо пополнить баланс.</Text>
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
                          if (user?.paymentMethod === 'balance' && lastOrder?.sum != null) {
                            const deficit = lastOrder.sum - (user?.balance || 0);
                            openTopUpModal(String(Math.max(0, Math.ceil(deficit))));
                          } else {
                            openTopUpModal();
                          }
                      }
                  }>
                      {user?.paymentMethod === "balance" ? (
                          <Text style={styles.buttonText}>Пополнить на {lastOrder?.sum - (user?.balance || 0)} ₸</Text>
                      ) : (
                          <Text style={styles.buttonText}>Пополнить баланс</Text>
                      )}
                  </TouchableOpacity>
                  <TouchableOpacity
                      style={{
                          backgroundColor: '#DC1818',
                          padding: 16,
                          borderRadius: 8,
                          marginTop: 12,
                      }}
                      onPress={() => reloadOrder('fakt')}
                  >
                      <Text style={styles.buttonText}>Оплатить наличными</Text>
                  </TouchableOpacity>
              </TouchableOpacity>
          </TouchableOpacity>
      </Modal>
      <Modal
        visible={masterCallConfirmModalVisible}
        onRequestClose={() => !masterCallLoading && setMasterCallConfirmModalVisible(false)}
        transparent={true}
        animationType="fade"
      >
        <TouchableOpacity
          style={styles.modalOverlayReloadOrder}
          activeOpacity={1}
          onPress={() => !masterCallLoading && setMasterCallConfirmModalVisible(false)}
        >
          <TouchableOpacity
            style={{
              backgroundColor: 'white',
              borderRadius: 8,
              width: '80%',
              paddingTop: 24,
            }}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >


            <Image source={require('../assets/mainFix.png')} style={{width: 100, height: 100, marginBottom: 12, alignSelf: 'center'}} />
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#101010',
                marginBottom: 12,
                textAlign: 'center',
              }}
            >
              Заявка принята!
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: '#545454',
                textAlign: 'center',
                paddingHorizontal: 24,
              }}
            >
              {(() => {
                const now = new Date();
                const day = now.getDay();
                const h = now.getHours();
                const isWeekend =
                  (day === 5 && h >= 18) ||
                  day === 6 ||
                  day === 0 ||
                  (day === 1 && h < 9);
                return isWeekend
                  ? 'Ваша заявка принята. Наш менеджер свяжется с вами в ближайший будний день.\nСб–Вс — выходные.'
                  : 'Спасибо! Мастер свяжется с вами в течение 10 минут.';
              })()}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 24,
                borderTopWidth: 1,
                borderTopColor: '#EDEDED',
                paddingVertical: 12,
              }}
            >
              <View style={{ 
                justifyContent: 'center',
                alignItems: 'center',
                borderRightWidth: 1,
                borderRightColor: '#EDEDED',
                width: "50%",
               }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#DC1818',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: masterCallLoading ? 0.7 : 1,
                  }}
                  onPress={handleRequestMasterCall}
                  disabled={masterCallLoading}
                >
                  {masterCallLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{
                      color: 'white',
                      fontSize: 14,
                      fontWeight: '500',
                    }}>Жду звонка</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={{ 
                justifyContent: 'center',
                alignItems: 'center',
                width: "50%",
               }}>
                
                <TouchableOpacity
                  style={{
                    padding: 14,
                    alignItems: 'center',
                  }}
                  onPress={() => !masterCallLoading && setMasterCallConfirmModalVisible(false)}
                  disabled={masterCallLoading}
                >
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#545454' }}>Отмена</Text>
                </TouchableOpacity>
              </View>

            </View>
            
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <Modal
        visible={masterCallSuccessModalVisible}
        onRequestClose={() => setMasterCallSuccessModalVisible(false)}
        transparent={true}
        animationType="fade"
      >
        <TouchableOpacity
          style={styles.modalOverlayReloadOrder}
          onPress={() => setMasterCallSuccessModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalContainerReloadOrder}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: '600',
                color: '#101010',
                marginBottom: 12,
                textAlign: 'center',
              }}
            >
              Заявка отправлена
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: '#545454',
                textAlign: 'center',
              }}
            >
              В ближайшее время с вами свяжется мастер.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#DC1818',
                padding: 16,
                borderRadius: 8,
                marginTop: 24,
              }}
              onPress={() => setMasterCallSuccessModalVisible(false)}
            >
              <Text style={styles.buttonText}>Понятно</Text>
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
