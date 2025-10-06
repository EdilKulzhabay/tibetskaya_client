# 📱 Как использовать автоматическое обновление статусов заказов

## ✅ Что было добавлено:

В `src/services/pushNotifications.ts` теперь используется **DeviceEventEmitter** для уведомления компонентов об изменении статуса заказа.

При получении push-уведомления:
1. ✅ Статус обновляется в AsyncStorage
2. ✅ Отправляется событие `orderStatusUpdated`
3. ✅ Все подписанные компоненты получают обновление
4. ✅ UI обновляется автоматически

---

## 🔧 Использование в компонентах

### Пример 1: Экран со списком активных заказов

```typescript
// src/screens/HomeScreen.tsx или где отображаются активные заказы

import React, { useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';

function HomeScreen() {
  const [orders, setOrders] = useState([]);

  // Загрузка заказов при монтировании
  useEffect(() => {
    loadOrders();
  }, []);

  // Подписка на обновления статусов
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'orderStatusUpdated',
      ({ orderId, newStatus, orderData }) => {
        console.log('🔄 Получено обновление заказа:', orderId, newStatus);
        
        // Обновляем состояние заказов
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId
              ? { ...order, status: newStatus, updatedAt: orderData.updatedAt }
              : order
          )
        );
        
        // Опционально: показать уведомление пользователю
        // Alert.alert('Статус заказа обновлен', `Заказ #${orderId.slice(-6)} теперь ${newStatus}`);
      }
    );

    // Очистка подписки при размонтировании
    return () => {
      subscription.remove();
    };
  }, []);

  const loadOrders = async () => {
    // Ваша логика загрузки заказов
    const response = await apiService.getActiveOrders(userMail);
    setOrders(response.data);
  };

  return (
    // Ваш UI
  );
}
```

---

### Пример 2: Экран деталей заказа (OrderStatusScreen)

```typescript
// src/screens/OrderStatusScreen.tsx

import React, { useEffect, useState } from 'react';
import { DeviceEventEmitter, Alert } from 'react-native';

function OrderStatusScreen({ route }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  // Подписка на обновления конкретного заказа
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'orderStatusUpdated',
      ({ orderId: updatedOrderId, newStatus, orderData }) => {
        // Проверяем, это обновление для текущего заказа?
        if (updatedOrderId === orderId) {
          console.log('🔄 Статус текущего заказа обновлен:', newStatus);
          
          // Обновляем состояние
          setOrder(prevOrder => ({
            ...prevOrder,
            ...orderData,
            status: newStatus,
          }));
          
          // Показываем уведомление
          Alert.alert(
            'Статус обновлен',
            `Ваш заказ теперь: ${getStatusText(newStatus)}`,
            [{ text: 'OK' }]
          );
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [orderId]);

  const loadOrderDetails = async () => {
    // Загрузка деталей заказа
  };

  const getStatusText = (status) => {
    const statusTexts = {
      pending: 'Ожидает обработки',
      accepted: 'Подтвержден',
      preparing: 'Готовится',
      on_way: 'В пути',
      delivered: 'Доставлен',
      cancelled: 'Отменен',
    };
    return statusTexts[status] || status;
  };

  return (
    // Ваш UI с отображением статуса
  );
}
```

---

### Пример 3: Экран истории заказов

```typescript
// src/screens/HistoryScreen.tsx

import React, { useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';

function HistoryScreen() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadOrderHistory();
  }, []);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'orderStatusUpdated',
      ({ orderId, newStatus, orderData }) => {
        // Обновляем заказ в истории
        setOrders(prevOrders => {
          const orderExists = prevOrders.some(o => o._id === orderId);
          
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

    return () => subscription.remove();
  }, []);

  const loadOrderHistory = async () => {
    // Загрузка истории заказов
  };

  return (
    // Ваш UI
  );
}
```

---

### Пример 4: Использование с useReducer (для сложной логики)

```typescript
import React, { useEffect, useReducer } from 'react';
import { DeviceEventEmitter } from 'react-native';

// Reducer для управления заказами
function ordersReducer(state, action) {
  switch (action.type) {
    case 'SET_ORDERS':
      return action.payload;
      
    case 'UPDATE_ORDER_STATUS':
      return state.map(order =>
        order._id === action.payload.orderId
          ? { ...order, status: action.payload.newStatus, updatedAt: action.payload.updatedAt }
          : order
      );
      
    case 'ADD_NEW_ORDER':
      return [action.payload, ...state];
      
    default:
      return state;
  }
}

function OrdersScreen() {
  const [orders, dispatch] = useReducer(ordersReducer, []);

  useEffect(() => {
    // Загрузка заказов
    loadOrders().then(data => {
      dispatch({ type: 'SET_ORDERS', payload: data });
    });
  }, []);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'orderStatusUpdated',
      ({ orderId, newStatus, orderData }) => {
        dispatch({
          type: 'UPDATE_ORDER_STATUS',
          payload: { orderId, newStatus, updatedAt: orderData.updatedAt },
        });
      }
    );

    return () => subscription.remove();
  }, []);

  return (
    // Ваш UI
  );
}
```

---

## 📊 Структура события orderStatusUpdated

```typescript
{
  orderId: string,        // ID заказа (например: "507f1f77bcf86cd799439011")
  newStatus: string,      // Новый статус ("pending", "on_way", "delivered" и т.д.)
  orderData: {            // Полные данные заказа
    _id: string,
    status: string,
    sum: number,
    client: string,
    address: {...},
    products: {...},
    date: {...},
    updatedAt: string,
    // ... другие поля
  }
}
```

---

## 🧪 Тестирование

### 1. Проверка в логах

При получении push-уведомления вы увидите:

```
📨 Уведомление на переднем плане
🔔 Обработка данных уведомления
📝 Обновление статуса заказа: on_way
✅ Статус заказа 507f1f77bcf86cd799439011 обновлен на: on_way
🔄 Получено обновление заказа: 507f1f77bcf86cd799439011 on_way
```

### 2. Отладка в компоненте

Добавьте временный лог:

```typescript
useEffect(() => {
  const subscription = DeviceEventEmitter.addListener(
    'orderStatusUpdated',
    (data) => {
      console.log('🎯 Компонент получил обновление:', data);
      // Ваша логика
    }
  );

  return () => subscription.remove();
}, []);
```

---

## ⚠️ Важные моменты

### 1. Всегда удаляйте подписку

```typescript
useEffect(() => {
  const subscription = DeviceEventEmitter.addListener(...);
  
  // ✅ ОБЯЗАТЕЛЬНО удаляйте подписку
  return () => {
    subscription.remove();
  };
}, []);
```

### 2. Фильтрация по orderId (если нужно)

```typescript
useEffect(() => {
  const subscription = DeviceEventEmitter.addListener(
    'orderStatusUpdated',
    ({ orderId, newStatus }) => {
      // Обновляем только если это нужный заказ
      if (orderId === currentOrderId) {
        updateOrderStatus(newStatus);
      }
    }
  );

  return () => subscription.remove();
}, [currentOrderId]);
```

### 3. Обработка ошибок

```typescript
useEffect(() => {
  const subscription = DeviceEventEmitter.addListener(
    'orderStatusUpdated',
    ({ orderId, newStatus, orderData }) => {
      try {
        // Ваша логика обновления
        setOrders(prev => /* ... */);
      } catch (error) {
        console.error('Ошибка обновления UI:', error);
      }
    }
  );

  return () => subscription.remove();
}, []);
```

---

## 🎯 Полный поток обновления

```
1. Сервер меняет статус заказа в БД
   ↓
2. Сервер отправляет push-уведомление
   ↓
3. Приложение получает уведомление
   ↓
4. handleNotificationData() обрабатывает данные
   ↓
5. Статус сохраняется в AsyncStorage
   ↓
6. DeviceEventEmitter.emit('orderStatusUpdated', {...})
   ↓
7. Все подписанные компоненты получают событие
   ↓
8. Компоненты обновляют свое состояние (setState)
   ↓
9. UI автоматически перерисовывается
   ↓
10. ✅ Пользователь видит новый статус
```

---

## ✅ Готово!

Теперь при получении push-уведомления:
- ✅ Статус обновляется в AsyncStorage
- ✅ Событие отправляется всем компонентам
- ✅ UI обновляется автоматически
- ✅ Пользователь видит изменения мгновенно

**Просто добавьте подписку на событие `orderStatusUpdated` в нужные компоненты!** 🎉

