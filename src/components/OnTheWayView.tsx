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

  const deliveryLocation = order.deliveryCoordinates || getDeliveryCoordinates(order.address || '');
  const courierLocation = order.courierLocation || { latitude: 43.2065, longitude: 76.8734 };

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

  return (
    <View style={styles.container}>
      {/* Информация о заказе */}
      <View style={styles.orderInfo}>
        <Text style={styles.orderTitle}>Заказ #{order.id} в пути</Text>
        <View style={styles.deliveryInfo}>
          <Text style={styles.deliveryText}>
            <Text style={styles.label}>Курьер: </Text>
            {order.courier?.fullName || 'Неизвестно'}
            {order.courier?.rating && (
              <Text style={styles.rating}> ⭐ {order.courier.rating}</Text>
            )}
          </Text>
          {order.courier?.phone && (
            <Text style={styles.deliveryText}>
              <Text style={styles.label}>Телефон: </Text>
              {order.courier.phone}
            </Text>
          )}
          {order.courier?.vehicleNumber && (
            <Text style={styles.deliveryText}>
              <Text style={styles.label}>Автомобиль: </Text>
              {order.courier.vehicleNumber}
            </Text>
          )}
          <Text style={styles.deliveryText}>
            <Text style={styles.label}>Адрес: </Text>
            {order.fullAddress || order.address}
          </Text>
          <Text style={styles.deliveryText}>
            <Text style={styles.label}>Время доставки: </Text>
            {order.deliveryTime}
          </Text>
          {order.customerNotes && (
            <Text style={styles.deliveryText}>
              <Text style={styles.label}>Примечания: </Text>
              {order.customerNotes}
            </Text>
          )}
        </View>
      </View>

      {/* Статистика доставки */}
      {/* <View style={styles.deliveryStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{estimatedTime}</Text>
          <Text style={styles.statLabel}>Осталось времени</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{courierDistance}</Text>
          <Text style={styles.statLabel}>До вас</Text>
        </View>
      </View> */}

      {/* Карта с курьером */}
      <View style={styles.mapContainer}>
        <MapProvider
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
  deliveryStats: {
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#545454',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E3E3E3',
    marginHorizontal: 20,
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