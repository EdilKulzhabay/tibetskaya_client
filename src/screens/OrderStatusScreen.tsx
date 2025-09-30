import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { AwaitingOrderView, OnTheWayView, Back } from '../components';

type OrderStatusRouteProp = RouteProp<RootStackParamList, 'OrderStatus'>;
type OrderStatusNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OrderStatus'>;

const OrderStatusScreen: React.FC = () => {
  const route = useRoute<OrderStatusRouteProp>();
  const navigation = useNavigation<OrderStatusNavigationProp>();
  
  // Получаем данные заказа из параметров
  const { order } = route.params;

  useEffect(() => {
    console.log(order);
  }, [order]);

  const getStatusText = (status: string) => {
    switch (status) {
      case "awaitingOrder":
        return "Ожидает заказа";
      case "onTheWay":
        return "В пути";
      case "delivered":
        return "Принято";
      default:
        return "Отменено";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "awaitingOrder":
      case "onTheWay":
        return "#EB7E00";
      case "delivered":
        return "#00B01A";
      default:
        return "#DC1818";
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      "Отменить заказ",
      "Вы уверены, что хотите отменить заказ?",
      [
        {
          text: "Нет",
          style: "cancel"
        },
        { 
          text: "Да", 
          onPress: () => {
            // Здесь будет логика отмены заказа
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleCallCourier = () => {
    Alert.alert(
      "Связаться с курьером",
      "Позвонить курьеру?",
      [
        {
          text: "Отмена",
          style: "cancel"
        },
        { 
          text: "Позвонить", 
          onPress: () => {
            // Здесь будет логика звонка
            console.log("Calling courier...");
          }
        }
      ]
    );
  };

  // Условный рендер в зависимости от статуса
  const renderOrderContent = () => {
    switch (order.status) {
      case "awaitingOrder":
        return (
          <AwaitingOrderView
            order={order} 
            onCancelOrder={handleCancelOrder}
            navigation={navigation}
          />
        );
        
      case "onTheWay":
        return (
          // <View></View>
          <OnTheWayView 
            order={order} 
            onCallCourier={handleCallCourier}
          />
        );
        
      default:
        // Для остальных статусов показываем стандартную страницу
        return (
          <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderTitle}>Заказ #{order._id}</Text>
                <Text style={[styles.orderStatus, { color: getStatusColor(order.status) }]}>
                  {getStatusText(order.status)}
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Дата заказа:</Text>
                <Text style={styles.infoValue}>
                  {typeof order.date === 'string' ? order.date : order.date?.d || 'Не указана'}
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Статус:</Text>
                <Text style={[styles.infoValue, { color: getStatusColor(order.status) }]}>
                  {getStatusText(order.status)}
                </Text>
              </View>

              {order.courier && (
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Курьер:</Text>
                  <Text style={styles.infoValue}>
                    {typeof order.courier === 'string' ? 'ID: ' + order.courier : order.courier?.fullName || 'Неизвестно'}
                  </Text>
                </View>
              )}

              <View style={styles.productsCard}>
                <Text style={styles.cardTitle}>Товары в заказе:</Text>
                {order.products.b12 > 0 && (
                  <View style={styles.productItem}>
                    <Text style={styles.productText}>
                      Бутылка 12л: {order.products.b12} шт.
                    </Text>
                  </View>
                )}
                {order.products.b19 > 0 && (
                  <View style={styles.productItem}>
                    <Text style={styles.productText}>
                      Бутылка 19л: {order.products.b19} шт.
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>Назад к заказам</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Back navigation={navigation} title="Заказ" />
      
      {renderOrderContent()}
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
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  orderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  orderStatus: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  productItem: {
    marginBottom: 8,
  },
  productText: {
    fontSize: 16,
    color: '#666',
  },
  backButton: {
    backgroundColor: '#DC1818',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderStatusScreen;