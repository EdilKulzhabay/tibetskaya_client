import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { OrderData } from '../types/navigation';
import MapProvider from './MapProvider';

interface OnTheWayViewProps {
  order: OrderData;
  onCallCourier?: () => void;
  onTrackOrder?: () => void;
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
}) => {
  const [estimatedTime, setEstimatedTime] = useState('15-20 мин');
  const [courierDistance, setCourierDistance] = useState('1.2 км');
  const [currentCourierLocation, setCurrentCourierLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  const deliveryLocation = order.deliveryCoordinates || 
    (order.address?.point ? { latitude: order.address.point.lat, longitude: order.address.point.lon } : null) ||
    getDeliveryCoordinates(order.address?.actual || order.address?.name || '');
  
  // Начальная позиция курьера (склад/база)
  const initialCourierLocation = { latitude: 43.2220, longitude: 76.8512 };
  // Используем только currentCourierLocation, если он установлен, иначе начальную позицию
  const courierLocation = currentCourierLocation || initialCourierLocation;

  // Обновление информации о курьере при изменении его местоположения
  const handleCourierLocationUpdate = (newLocation: { latitude: number; longitude: number }) => {
    // Здесь можно вычислить расстояние и время доставки
    const distance = calculateDistance(newLocation, deliveryLocation);
    setCourierDistance(`${distance.toFixed(1)} км`);
    
    // Простая оценка времени (примерно 3 км/час скорость курьера)
    const timeInMinutes = Math.round((distance / 3) * 60);
    setEstimatedTime(`${timeInMinutes}-${timeInMinutes + 5} мин`);
  };

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

  // Функция для вычисления следующей точки на пути к цели
  const getNextLocation = (
    current: { latitude: number; longitude: number },
    target: { latitude: number; longitude: number },
    distanceKm: number
  ) => {
    const distance = calculateDistance(current, target);
    
    // Если уже достигли цели или очень близко
    if (distance <= 0.01) { // 10 метров
      return target;
    }

    // Вычисляем направление
    const bearing = Math.atan2(
      Math.sin((target.longitude - current.longitude) * Math.PI / 180) * Math.cos(target.latitude * Math.PI / 180),
      Math.cos(current.latitude * Math.PI / 180) * Math.sin(target.latitude * Math.PI / 180) - 
      Math.sin(current.latitude * Math.PI / 180) * Math.cos(target.latitude * Math.PI / 180) * 
      Math.cos((target.longitude - current.longitude) * Math.PI / 180)
    );

    // Вычисляем новую позицию
    const R = 6371; // Радиус Земли в км
    const lat1 = current.latitude * Math.PI / 180;
    const lon1 = current.longitude * Math.PI / 180;
    
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distanceKm / R) +
      Math.cos(lat1) * Math.sin(distanceKm / R) * Math.cos(bearing)
    );
    
    const lon2 = lon1 + Math.atan2(
      Math.sin(bearing) * Math.sin(distanceKm / R) * Math.cos(lat1),
      Math.cos(distanceKm / R) - Math.sin(lat1) * Math.sin(lat2)
    );

    return {
      latitude: lat2 * 180 / Math.PI,
      longitude: lon2 * 180 / Math.PI
    };
  };

  // Функция для движения курьера
  const moveCourier = () => {
    if (!deliveryLocation) {
      console.log('Нет адреса доставки, движение невозможно');
      return;
    }

    const currentLocation = currentCourierLocation || initialCourierLocation;
    const distanceToTarget = calculateDistance(currentLocation, deliveryLocation);
    
    console.log(`Курьер на позиции: ${currentLocation.latitude}, ${currentLocation.longitude}`);
    console.log(`Расстояние до цели: ${distanceToTarget.toFixed(2)} км`);
    
    // Если курьер уже достиг цели
    if (distanceToTarget <= 0.01) { // 10 метров
      console.log('Курьер достиг цели! Возвращаем на начальную позицию...');
      setCurrentCourierLocation(initialCourierLocation);
      // Не останавливаем движение, просто возвращаемся на старт
      return;
    }

    // Двигаемся на 500 метров (0.5 км) каждые 15 секунд
    const stepDistance = 0.5; // 500 метров в км
    const nextLocation = getNextLocation(currentLocation, deliveryLocation, stepDistance);
    
    console.log(`Новая позиция курьера: ${nextLocation.latitude}, ${nextLocation.longitude}`);
    
    setCurrentCourierLocation(nextLocation);
    console.log('setCurrentCourierLocation вызван с:', nextLocation);
    
    // Обновляем информацию о расстоянии и времени
    const newDistance = calculateDistance(nextLocation, deliveryLocation);
    setCourierDistance(`${newDistance.toFixed(1)} км`);
    
    const timeInMinutes = Math.round((newDistance / 3) * 60); // 3 км/час скорость
    setEstimatedTime(`${timeInMinutes}-${timeInMinutes + 5} мин`);
    
    // Вызываем callback для обновления карты
    handleCourierLocationUpdate(nextLocation);
  };

  // Запуск движения курьера
  useEffect(() => {
    console.log('Запуск движения курьера для заказа:', order._id);
    setIsMoving(true);
    // Устанавливаем начальную позицию курьера
    setCurrentCourierLocation(initialCourierLocation);
    
    // Делаем первый шаг сразу
    setTimeout(() => {
      console.log('Первый шаг движения курьера');
      moveCourier();
    }, 2000); // 2 секунды задержка для инициализации
    
    // Запускаем интервал движения каждые 15 секунд
    const interval = setInterval(() => {
      console.log('Таймер сработал, вызываем moveCourier');
      moveCourier();
    }, 15000); // 15 секунд

    return () => {
      console.log('Очищаем интервал для заказа:', order._id);
      clearInterval(interval);
    };
  }, [order._id]); // Перезапускаем только при смене заказа

  // Отслеживаем изменения позиции курьера
  useEffect(() => {
    if (currentCourierLocation) {
      console.log('Позиция курьера обновлена:', currentCourierLocation);
      console.log('Передаем в MapProvider courierLocation:', currentCourierLocation);
      // Уведомляем MapProvider об изменении позиции
      handleCourierLocationUpdate(currentCourierLocation);
    }
  }, [currentCourierLocation]);

  return (
    <View style={styles.container}>
      {/* Информация о заказе */}
      <View style={styles.orderInfo}>
        <Text style={styles.orderTitle}>Заказ #{order._id} в пути</Text>
        <View style={styles.deliveryInfo}>
          <Text style={styles.deliveryText}>
            <Text style={styles.label}>Курьер: </Text>
            {typeof order.courier === 'string' ? 'ID: ' + order.courier : (order.courier?.fullName || 'Неизвестно')}
            {typeof order.courier === 'object' && order.courier && 'rating' in order.courier && order.courier.rating && (
              <Text style={styles.rating}> ⭐ {order.courier.rating}</Text>
            )}
          </Text>
          {typeof order.courier === 'object' && order.courier && 'phone' in order.courier && order.courier.phone && (
            <Text style={styles.deliveryText}>
              <Text style={styles.label}>Телефон: </Text>
              {order.courier.phone}
            </Text>
          )}
          {typeof order.courier === 'object' && order.courier && 'vehicleNumber' in order.courier && order.courier.vehicleNumber && (
            <Text style={styles.deliveryText}>
              <Text style={styles.label}>Автомобиль: </Text>
              {order.courier.vehicleNumber}
            </Text>
          )}
          <Text style={styles.deliveryText}>
            <Text style={styles.label}>Адрес: </Text>
            {order.fullAddress || order.address?.actual || order.address?.name || 'Не указан'}
          </Text>
          <Text style={styles.deliveryText}>
            <Text style={styles.label}>Время доставки: </Text>
            {order.date?.d || order.deliveryTime || 'Не указано'}
          </Text>
          {(order.comment || order.customerNotes) && (
            <Text style={styles.deliveryText}>
              <Text style={styles.label}>Примечания: </Text>
              {order.comment || order.customerNotes}
            </Text>
          )}
        </View>
      </View>


      {/* Карта с курьером */}
      <View style={styles.mapContainer}>
        <MapProvider
          key={`courier-${currentCourierLocation?.latitude}-${currentCourierLocation?.longitude}`}
          courierLocation={courierLocation}
          deliveryLocation={deliveryLocation}
          showCourierRoute={true}
          onCourierLocationUpdate={handleCourierLocationUpdate}
        />
      </View>

      {/* Кнопки действий */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={onCallCourier}
        >
          <Text style={styles.buttonText}>📞 Позвонить курьеру</Text>
        </TouchableOpacity>
      </View>

      {/* Информация о товарах */}
      {/* <View style={styles.productsInfo}>
        <Text style={styles.productsTitle}>Состав заказа:</Text>
        {order.products.map((product, index) => (
          <View key={index} style={styles.productItem}>
            {product.b12 > 0 && (
              <View style={styles.productRow}>
                <Text style={styles.productText}>• {product.b12}x Вода 12,5 л</Text>
                {product.price && <Text style={styles.productPrice}>{product.price} ₸</Text>}
              </View>
            )}
            {product.b19 > 0 && (
              <View style={styles.productRow}>
                <Text style={styles.productText}>• {product.b19}x Вода 18,9 л</Text>
                {product.price && <Text style={styles.productPrice}>{product.price} ₸</Text>}
              </View>
            )}
            {product.name && !product.b12 && !product.b19 && (
              <View style={styles.productRow}>
                <Text style={styles.productText}>• {product.name}</Text>
                {product.price && <Text style={styles.productPrice}>{product.price} ₸</Text>}
              </View>
            )}
          </View>
        ))}
        <View style={styles.orderSummary}>
          {order.subtotal && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Подитог:</Text>
              <Text style={styles.summaryValue}>{order.subtotal} ₸</Text>
            </View>
          )}
          {order.deliveryFee && order.deliveryFee > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Доставка:</Text>
              <Text style={styles.summaryValue}>{order.deliveryFee} ₸</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.totalAmount}>Итого: {order.totalAmount} ₸</Text>
          </View>
        </View>
      </View> */}
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
  },
  button: {
    backgroundColor: '#DC1818',
    padding: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
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