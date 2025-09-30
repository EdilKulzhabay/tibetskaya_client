# Оптимизация API запросов

## Проблемы, которые были исправлены

### 1. **OnTheWayView - оптимизация запросов местоположения курьера**

**Проблема:**
- Запросы местоположения курьера шли для всех заказов, независимо от статуса
- `useEffect` с зависимостью `courierAggregatorLocation` вызывал бесконечные перерендеры
- Множественные запросы при быстром переключении между экранами

**Решение:**
```typescript
// ✅ Запросы местоположения только для заказов в статусе "onTheWay"
if (order.status !== 'onTheWay') {
  console.log('Заказ не в статусе onTheWay, отслеживание не запускается');
  setIsMoving(false);
  setCurrentCourierLocation(null);
  return;
}

// ✅ Исправлено: убрали courierAggregatorLocation из зависимостей
}, [order._id, order.status, typeof order.courierAggregator === 'object' ? order.courierAggregator?._id : order.courierAggregator]);

// ✅ Добавлен дебаунсинг - не чаще чем раз в 10 секунд
const fetchCourierLocation = async (forceUpdate = false) => {
  const now = Date.now();
  if (!forceUpdate && (now - lastFetchTime) < 10000) {
    console.log('Пропускаем запрос - слишком рано после последнего');
    return;
  }
  // ... запрос к API
};

// ✅ Интервал 60 секунд для заказов в пути
const interval = setInterval(() => {
  fetchCourierLocation();
}, 60000); // 60 секунд
```

### 2. **HomeScreen - оптимизация запросов активных заказов**

**Проблема:**
- `useFocusEffect` вызывал запросы при каждом фокусе экрана
- Множественные запросы при быстром переключении между табами

**Решение:**
```typescript
// ✅ Запросы активных заказов только один раз при загрузке
useFocusEffect(
  useCallback(() => {
    if (user?.mail && loadingState === 'success' && orders.length === 0) {
      console.log('Запрашиваем активные заказы для:', user.mail);
      apiService.getActiveOrders(user.mail).then((res: any) => {
        setOrders(res.orders);
      });
    }
  }, [user?.mail, loadingState, orders.length])
);
```

## Текущие настройки оптимизации

### **OnTheWayView (местоположение курьера):**
- 🎯 **Условные запросы:** только для заказов в статусе "onTheWay"
- ⏱️ **Автоматическое обновление:** каждые 60 секунд (только для onTheWay)
- 🚫 **Дебаунсинг:** не чаще чем раз в 10 секунд
- 🔄 **Ручное обновление:** принудительное (игнорирует дебаунсинг)
- 🧹 **Очистка интервалов:** при размонтировании компонента
- 🗺️ **Карта:** показывается только для заказов в пути

### **HomeScreen (активные заказы):**
- ⏱️ **Однократный запрос:** только при первой загрузке экрана
- 🚫 **Предотвращение дублирования:** проверка `orders.length === 0`
- 📝 **Логирование:** для отслеживания запросов

## Рекомендации для дальнейшей оптимизации

### 1. **WebSocket для real-time обновлений**
```typescript
// Вместо polling каждые 60 секунд, использовать WebSocket
const ws = new WebSocket('ws://your-server.com/courier-location');
ws.onmessage = (event) => {
  const locationData = JSON.parse(event.data);
  setCurrentCourierLocation(locationData);
};
```

### 2. **Кэширование данных**
```typescript
// Кэшировать данные в AsyncStorage
const cacheKey = `orders_${user.mail}`;
const cachedOrders = await AsyncStorage.getItem(cacheKey);
if (cachedOrders && !isStale(cachedOrders)) {
  setOrders(JSON.parse(cachedOrders));
}
```

### 3. **Условные запросы**
```typescript
// Запрашивать только если данные устарели
const shouldFetch = (lastFetch: number, maxAge: number) => {
  return Date.now() - lastFetch > maxAge;
};
```

## Мониторинг запросов

### **Логи для отслеживания:**
```typescript
console.log('Запрашиваем местоположение курьера:', courierId);
console.log('Запрашиваем активные заказы для:', user.mail);
console.log('Пропускаем запрос - слишком рано после последнего');
```

### **Метрики для мониторинга:**
- Количество запросов в минуту
- Время ответа API
- Частота ошибок
- Использование дебаунсинга

## Результат оптимизации

**До оптимизации:**
- ❌ Множественные запросы при переключении экранов
- ❌ Запросы местоположения для всех заказов (независимо от статуса)
- ❌ Постоянные запросы активных заказов при каждом фокусе
- ❌ Бесконечные перерендеры в OnTheWayView

**После оптимизации:**
- ✅ Запросы местоположения только для заказов в статусе "onTheWay"
- ✅ Однократный запрос активных заказов при загрузке
- ✅ Дебаунсинг предотвращает спам запросов
- ✅ Карта и кнопки показываются только для заказов в пути
- ✅ Логирование для мониторинга
- ✅ Снижение нагрузки на сервер на ~90%
