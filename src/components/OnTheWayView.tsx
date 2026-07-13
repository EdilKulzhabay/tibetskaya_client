import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { OrderData } from '../types/navigation';
import MapProvider from './MapProvider';
import { apiService } from '../api/services';

interface OnTheWayViewProps {
  order: OrderData;
  onCallCourier?: () => void;
  onTrackOrder?: () => void;
  onChatWithCourier?: () => void;
}

// Координаты различных адресов в Алматы для примера
const getDeliveryCoordinates = (address: string) => {
  // Определяем координаты на основе адреса
  if (address.includes('Самал-1')) {
    return { latitude: 43.2267, longitude: 76.8782 };
  } else if (address.includes('Самал-2')) {
    return { latitude: 43.2156, longitude: 76.8934 };
  } else if (address.includes('Бостандык')) {
    return { latitude: 43.2065, longitude: 76.8734 };
  } else if (address.includes('Абая')) {
    return { latitude: 43.2418, longitude: 76.9562 };
  } else {
    // Координаты по умолчанию - центр Алматы
    return { latitude: 43.2220, longitude: 76.8512 };
  }
};

const OnTheWayView: React.FC<OnTheWayViewProps> = ({
  order,
  onCallCourier,
  onTrackOrder,
  onChatWithCourier,
}) => {
  const [estimatedTime, setEstimatedTime] = useState('15-20 мин');
  const [courierDistance, setCourierDistance] = useState('1.2 км');
  const [currentCourierLocation, setCurrentCourierLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [refreshTimer, setRefreshTimer] = useState<number>(0);

  const deliveryLocation = order.deliveryCoordinates || 
    (order.address?.point ? { latitude: order.address.point.lat, longitude: order.address.point.lon } : null) ||
    getDeliveryCoordinates(order.address?.actual || order.address?.name || '');
  
  // Получаем координаты курьера из courierAggregator.point
  // Проверяем, что courierAggregator существует и является объектом с координатами
  const courierAggregatorLocation = order.courierAggregator && 
    typeof order.courierAggregator === 'object' && 
    'point' in order.courierAggregator && 
    order.courierAggregator.point &&
    typeof order.courierAggregator.point.lat === 'number' &&
    typeof order.courierAggregator.point.lon === 'number'
    ? { latitude: order.courierAggregator.point.lat, longitude: order.courierAggregator.point.lon }
    : null;
  
  // Начальная позиция курьера (склад/база) - fallback
  const initialCourierLocation = { latitude: 43.2220, longitude: 76.8512 };
  // Используем currentCourierLocation, затем реальные координаты курьера, затем начальную позицию
  const courierLocation = currentCourierLocation || courierAggregatorLocation || initialCourierLocation;

  // Функция для получения реального местоположения курьера с сервера
  const fetchCourierLocation = async (forceUpdate = false) => {
    if (!order.courierAggregator || typeof order.courierAggregator === 'string') {
      return;
    }

    // Дебаунсинг - не делаем запрос чаще чем раз в 10 секунд
    const now = Date.now();
    if (!forceUpdate && (now - lastFetchTime) < 10000) {
      console.log('Пропускаем запрос - слишком рано после последнего');
      return;
    }

    // Если таймер активен, не выполняем запрос
    if (refreshTimer > 0) {
      return;
    }

    try {
      const courierId = order.courierAggregator._id;
      console.log('Запрашиваем местоположение курьера:', courierId);
      const response = await apiService.getCourierLocation(courierId);
      
      if (response.point && response.point.lat && response.point.lon) {
        const newLocation = {
          latitude: response.point.lat,
          longitude: response.point.lon
        };
        
        console.log('Получено новое местоположение курьера:', newLocation);
        setCurrentCourierLocation(newLocation);
        setLastFetchTime(now);
        handleCourierLocationUpdate(newLocation);
      }
    } catch (error) {
      console.error('Ошибка при получении местоположения курьера:', error);
    }
  };

  // Обработчик нажатия на кнопку обновления местоположения
  const handleRefreshLocation = () => {
    if (refreshTimer > 0) {
      return; // Игнорируем нажатие, если таймер активен
    }
    
    // Запускаем таймер на 20 секунд
    setRefreshTimer(20);
    
    // Выполняем обновление местоположения
    fetchCourierLocation(true);
  };

  // Эффект для обратного отсчета таймера
  useEffect(() => {
    if (refreshTimer > 0) {
      const interval = setInterval(() => {
        setRefreshTimer((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [refreshTimer]);

  // Обновление информации о курьере при изменении его местоположения
  const handleCourierLocationUpdate = useCallback((newLocation: { latitude: number; longitude: number }) => {
    // Здесь можно вычислить расстояние и время доставки
    const distance = calculateDistance(newLocation, deliveryLocation);
    setCourierDistance(`${distance.toFixed(1)} км`);
    
    // Простая оценка времени (примерно 3 км/час скорость курьера)
    const timeInMinutes = Math.round((distance / 3) * 60);
    setEstimatedTime(`${timeInMinutes}-${timeInMinutes + 5} мин`);
  }, [deliveryLocation]);

  // Простая функция расчета расстояния между двумя точками
  const calculateDistance = (
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ) => {
    const R = 6371; // Радиус Земли в км
    const dLat = (point2.latitude - point1.latitude) * (Math.PI / 180);
    const dLon = (point2.longitude - point1.longitude) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(point1.latitude * (Math.PI / 180)) *
      Math.cos(point2.latitude * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Запуск отслеживания курьера
  useEffect(() => {
    console.log('Запуск отслеживания курьера для заказа:', order._id, 'статус:', order.status);
    
    // Запрашиваем местоположение курьера только для заказов в статусе "onTheWay"
    if (order.status !== 'onTheWay') {
      console.log('Заказ не в статусе onTheWay, отслеживание не запускается');
      setIsMoving(false);
      setCurrentCourierLocation(null);
      return;
    }
    
    // Если курьер не назначен, не запускаем отслеживание
    if (!order.courierAggregator) {
      console.log('Курьер не назначен, отслеживание не запускается');
      setIsMoving(false);
      setCurrentCourierLocation(null);
      return;
    }
    
    setIsMoving(true);
    
    // Если есть реальные координаты курьера, используем их
    if (courierAggregatorLocation) {
      console.log('Используем реальные координаты курьера:', courierAggregatorLocation);
      setCurrentCourierLocation(courierAggregatorLocation);
    } else {
      // Иначе используем начальную позицию
      setCurrentCourierLocation(initialCourierLocation);
    }
    
    // Получаем первое обновление местоположения сразу
    setTimeout(() => {
      console.log('Первое обновление местоположения курьера');
      fetchCourierLocation();
    }, 2000); // 2 секунды задержка для инициализации
    
    // Запускаем интервал обновления местоположения каждые 60 секунд
    const interval = setInterval(() => {
      console.log('Обновляем местоположение курьера');
      fetchCourierLocation();
    }, 60000); // 60 секунд

    return () => {
      console.log('Очищаем интервал для заказа:', order._id);
      clearInterval(interval);
    };
  }, [order._id, order.status, typeof order.courierAggregator === 'object' ? order.courierAggregator?._id : order.courierAggregator]); // Перезапускаем при смене заказа, статуса или ID курьера

  // Отслеживаем изменения позиции курьера
  useEffect(() => {
    if (currentCourierLocation) {
      console.log('Позиция курьера обновлена:', currentCourierLocation);
      console.log('Передаем в MapProvider courierLocation:', currentCourierLocation);
      // Уведомляем MapProvider об изменении позиции
      handleCourierLocationUpdate(currentCourierLocation);
    }
  }, [currentCourierLocation]);

  useEffect(() => {
    console.log('Заказ обновлен в статусе onTheWay');
    console.log('Заказ:', order ? JSON.stringify(order, null, 2) : 'Не указан');
    console.log('Курьер:', order.courierAggregator ? JSON.stringify(order.courierAggregator, null, 2) : 'Не указан');
  }, [order]);

  return (
    <View style={styles.container}>
      {/* Информация о заказе */}
      <View style={styles.orderInfo}>
        <Text style={styles.orderTitle}>
          Заказ {order.status === 'onTheWay' ? 'в пути' : order.status === 'awaitingOrder' ? 'ожидает курьера' : ""}
        </Text>
        <View style={styles.deliveryInfo}>
          <Text style={styles.deliveryText}>
            <Text style={styles.label}>Курьер: </Text>
            {!order.courierAggregator && 'Ожидается назначение курьера'}
            {order.courierAggregator && typeof order.courierAggregator === 'object' && 'fullName' in order.courierAggregator && order.courierAggregator.fullName && (
             order.courierAggregator?.fullName || 'Неизвестно')
            }
          </Text>
          {order.courierAggregator && typeof order.courierAggregator === 'object' && 'carNumber' in order.courierAggregator && order.courierAggregator.carNumber && (
            <Text style={styles.deliveryText}>
              <Text style={styles.label}>Автомобиль: </Text>
              {order.courierAggregator.carNumber}
            </Text>
          )}
          <Text style={styles.deliveryText}>
            <Text style={styles.label}>Адрес: </Text>
            {order.address?.actual || 'Не указан'}
          </Text>
          <Text style={styles.deliveryText}>
            <Text style={styles.label}>Время доставки: </Text>
            {order?.date?.d || 'Не указано'}
          </Text>
          <Text style={styles.deliveryText}>
            <Text style={styles.label}>Способ оплаты: </Text>
            {order.opForm === "fakt" ? "Нал_Карта_QR" : (order.opForm === "credit" || order.opForm === "coupon") ? "С баланса" : 'Нал_Карта_QR'}
          </Text>
          {(order.comment || order.customerNotes) && (
            <Text style={styles.deliveryText}>
              <Text style={styles.label}>Примечания: </Text>
              {order.comment || order.customerNotes}
            </Text>
          )}
        </View>
      </View>


      {/* Карта с курьером - показываем только для заказов в пути */}
      {order.status === 'onTheWay' && (
        <View style={styles.mapContainer}>
          <MapProvider
            key={`courier-${currentCourierLocation?.latitude}-${currentCourierLocation?.longitude}-${order.courierAggregator ? 'assigned' : 'not-assigned'}`}
            courierLocation={order.courierAggregator ? courierLocation : undefined}
            deliveryLocation={deliveryLocation}
            showCourierRoute={!!order.courierAggregator}
            onCourierLocationUpdate={handleCourierLocationUpdate}
          />
        </View>
      )}

      {/* Кнопки действий - показываем только для заказов в пути */}
      {order.status === 'onTheWay' && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.button, !order.courierAggregator && styles.buttonDisabled]} 
            onPress={order.courierAggregator ? onCallCourier : undefined}
            disabled={!order.courierAggregator}
          >
            <Text style={[styles.buttonText, !order.courierAggregator && styles.buttonTextDisabled]}>
              {order.courierAggregator ? '📞 Позвонить курьеру' : '⏳ Ожидается назначение курьера'}
            </Text>
          </TouchableOpacity>

          {order.courierAggregator && (
            <TouchableOpacity
              style={[styles.button, styles.chatButton]}
              onPress={onChatWithCourier}
            >
              <Text style={styles.buttonText}>💬 Написать курьеру</Text>
            </TouchableOpacity>
          )}

          {order.courierAggregator && (
            <TouchableOpacity 
              style={[styles.button, styles.refreshButton, refreshTimer > 0 && styles.buttonDisabled]} 
              onPress={handleRefreshLocation}
              disabled={refreshTimer > 0}
            >
              <Text style={[styles.buttonText, refreshTimer > 0 && styles.buttonTextDisabled]}>
                {refreshTimer > 0 ? `⏳ Обновление через ${refreshTimer} сек` : '🔄 Обновить местоположение'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  orderInfo: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101010',
    marginBottom: 12,
  },
  deliveryInfo: {
    gap: 8,
  },
  deliveryText: {
    fontSize: 14,
    color: '#545454',
  },
  label: {
    fontWeight: '600',
    color: '#101010',
  },
  rating: {
    color: '#FF8C00',
    fontSize: 14,
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  actions: {
    backgroundColor: 'white',
    padding: 24,
    marginBottom: 30,
    gap: 12,
  },
  button: {
    backgroundColor: '#DC1818',
    padding: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonTextDisabled: {
    color: '#666666',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
  },
  chatButton: {
    backgroundColor: '#3da163',
  },
  productsInfo: {
    backgroundColor: 'white',
    padding: 16,
  },
  productsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101010',
    marginBottom: 12,
  },
  productItem: {
    marginBottom: 8,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productText: {
    fontSize: 14,
    color: '#545454',
    flex: 1,
  },
  productPrice: {
    fontSize: 14,
    color: '#101010',
    fontWeight: '600',
  },
  orderSummary: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E3E3E3',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#545454',
  },
  summaryValue: {
    fontSize: 14,
    color: '#101010',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101010',
    textAlign: 'center',
  },
});

export default OnTheWayView;