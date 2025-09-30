# Обновление местоположения курьера в реальном времени

## Как это работает

### 1. **API Integration**
- ✅ Добавлен метод `apiService.getCourierLocation(courierId)` в `src/api/services.ts`
- ✅ Использует ваш существующий endpoint `/getCourierLocation`

### 2. **Автоматическое обновление**
- ✅ **При загрузке заказа** - используется `order.courierAggregator.point` из API
- ✅ **Каждые 30 секунд** - автоматический запрос актуального местоположения
- ✅ **При получении новых координат** - карта обновляется автоматически

### 3. **Ручное обновление**
- ✅ Кнопка "🔄 Обновить местоположение" для мгновенного обновления
- ✅ Показывается только когда курьер назначен

### 4. **Fallback логика**
- ✅ Если курьер не назначен - отслеживание не запускается
- ✅ Если API недоступен - используются последние известные координаты
- ✅ Если координаты отсутствуют - используется центр Алматы

## Код изменений

### `src/api/services.ts`
```typescript
getCourierLocation: async (courierId: string) => {
  try {
    const response = await api.post('/getCourierLocation', {courierId});
    return response.data;
  } catch (error) {
    throw error;
  }
}
```

### `src/components/OnTheWayView.tsx`
```typescript
// Функция для получения реального местоположения курьера
const fetchCourierLocation = async () => {
  if (!order.courierAggregator || typeof order.courierAggregator === 'string') {
    return;
  }

  try {
    const courierId = order.courierAggregator._id;
    const response = await apiService.getCourierLocation(courierId);
    
    if (response.point && response.point.lat && response.point.lon) {
      const newLocation = {
        latitude: response.point.lat,
        longitude: response.point.lon
      };
      
      setCurrentCourierLocation(newLocation);
      handleCourierLocationUpdate(newLocation);
    }
  } catch (error) {
    console.error('Ошибка при получении местоположения курьера:', error);
  }
};

// Автоматическое обновление каждые 30 секунд
useEffect(() => {
  // ... проверки ...
  
  const interval = setInterval(() => {
    fetchCourierLocation();
  }, 30000); // 30 секунд

  return () => clearInterval(interval);
}, [order._id, order.courierAggregator]);
```

## Требования к серверу

### Ваш API endpoint `/getCourierLocation`:
```javascript
export const getCourierLocation = async (req, res) => {
    try {
        const { courierId } = req.body;
        const courierAggregator = await CourierAggregator.findById(courierId);
        res.json({ point: courierAggregator.point });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Что-то пошло не так",
        });
    }
}
```

### Ожидаемый формат ответа:
```json
{
  "point": {
    "lat": 43.2098,
    "lon": 76.8845,
    "timestamp": "2025-01-15T14:30:00Z"
  }
}
```

## Преимущества

1. **Реальные данные** - больше никакой симуляции движения
2. **Автоматическое обновление** - пользователь видит актуальное местоположение
3. **Ручное обновление** - возможность обновить по требованию
4. **Безопасность** - корректная обработка ошибок и отсутствующих данных
5. **Производительность** - обновление каждые 30 секунд (можно настроить)

## Настройка интервала

Если нужно изменить частоту обновления, измените значение в `OnTheWayView.tsx`:
```typescript
const interval = setInterval(() => {
  fetchCourierLocation();
}, 30000); // Измените на нужное значение в миллисекундах
```

- 15000 = 15 секунд
- 30000 = 30 секунд (текущее)
- 60000 = 1 минута
