import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  DeviceEventEmitter,
  Alert,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import { Header, Navigation, OrderBlock } from '../components';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../api/services';
import { useAuth } from '../hooks/useAuth';

interface HistoryScreenProps {
  navigation?: any;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ navigation }) => {
  const { user, loadingState } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const getHistoryOrders = async () => {
    if (user?.mail && loadingState === 'success') {
      apiService.getOrders(user.mail).then((res: any) => {
        setOrders(res.orders);
      }).catch((error) => {
        console.error('Ошибка при получении истории заказов:', error);
      });
    }
  }


  useFocusEffect(
    useCallback(() => {
      // Ждем загрузки пользователя перед отправкой запроса
      getHistoryOrders();
    }, [user?.mail, loadingState])
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
    if (user?.mail && selectedOrder) {
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
      const res = await apiService.addOrder(user.mail, selectedOrder.address, selectedOrder.products, selectedOrder.clientNotes, orderDateObject, selectedPayment?.value, selectedOrder.needCall, selectedOrder.comment);
      if (res.success) {
        Alert.alert('Успешно', 'Заказ повторно оформлен');
        setPaymentModalVisible(false);
        getHistoryOrders();
      } else {
        Alert.alert('Ошибка', res.message);
      }
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header 
          bonus={0}
          showBackButton={false}
          showBonus={false}
        />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {orders.length === 0 && (
          <View style={styles.content}>
            <Text style={styles.title}>История заказов</Text>
            <Text style={styles.subtitle}>Здесь будет отображаться история ваших заказов</Text>
          </View>
        )}
        {orders.length > 0 && orders.map((order) => (
          <TouchableOpacity key={order._id} style={[orderBlockStyles.container, { borderColor: order.status === "onTheWay" ? "#DC1818" : "#E3E3E3", borderWidth: order.status === "onTheWay" ? 2 : 0 }]} onPress={() => {
            navigation.navigate('OrderStatus', { order: order });
          }}>
              <View style={orderBlockStyles.orderHeader}>
                  <Text># <Text style={{fontSize: 18, fontWeight: '600'}}>
                    {typeof order.date === 'string' ? order.date : order.date?.d || 'Не указана'}
                  </Text></Text>
                  <Text style={
                      [orderBlockStyles.orderStatus, 
                      order.status === "awaitingOrder" || order.status === "onTheWay" ? { color: "#EB7E00" } : 
                      order.status === "delivered" ? { color: "#00B01A" } : { color: "#DC1818" }]
                  }>{order.status === "awaitingOrder" ? "Заказ принят" : order.status === "onTheWay" ? "В пути" : order.status === "delivered" ? "Доставлен" : "Отменен"}</Text>
              </View>
              <View style={{height: 1, backgroundColor: '#E3E3E3', marginVertical: 12, width: '100%' }} />
              <View style={orderBlockStyles.orderBody}>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                      <View>
                          <View style={orderBlockStyles.orderProduct}>
                              {order.products && order.products.b12 > 0 && (
                                  <Text>{order.products.b12}x Вода 12,5 л</Text>
                              )}
                              {order.products && order.products.b19 > 0 && (
                                  <Text>{order.products.b19}x Вода 18,9 л</Text>
                              )}
                          </View>
                          <View style={{flexDirection: "row", gap: 6, marginTop: 4, alignItems: 'center'}}>
                            <Image source={require('../assets/pin.png')} style={{width: 16, height: 16}} />
                            <Text style={orderBlockStyles.orderProduct}>{order.address.name}</Text>
                          </View>
                          
                      </View>
                      <TouchableOpacity 
                          style={{backgroundColor: '#DC1818', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10}}
                          onPress={() => {
                            setSelectedOrder(order);
                            setPaymentModalVisible(true);
                          }}
                      >
                          <Text style={{color: 'white', fontSize: 14, fontWeight: '600'}}>Повторить</Text>
                      </TouchableOpacity>
                  </View>

                  {order.courierAggregator && typeof order.courierAggregator === 'object' && order.courierAggregator.fullName && order.status !== "awaitingOrder" && (
                      <View style={orderBlockStyles.orderCourier}>
                          {order.status === "onTheWay" ? (
                              <Text>К вам едет: </Text>
                          ) : (
                              <Text>Доставил курьер: </Text>
                          )}
                          <Text style={orderBlockStyles.orderCourierName}>{order.courierAggregator.fullName}</Text>
                      </View>
                  )}
              </View>
              
          </TouchableOpacity>
        ))}
        <View style={{height: 40}}></View>
      </ScrollView>
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
                        {user && user?.paidBootles && user?.paidBootles > 0 ? (
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
      {/* <Navigation /> */}
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
});

const orderBlockStyles = StyleSheet.create({
  container: {
      marginTop: 16,
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
  },
  orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  orderBody: {
  },
  orderStatus: {
      fontSize: 14,
      fontWeight: '600',
  },
  orderProduct: {
      fontSize: 14,
      color: '#545454',
      fontWeight: '500',
      gap: 8
  },
  orderCourier: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      fontSize: 14,
      color: '#545454',
      fontWeight: '500',
      gap: 8
  },
  orderCourierName: {
      fontSize: 16,
      color: '#000',
      fontWeight: '600',
  },
});

export default HistoryScreen;
