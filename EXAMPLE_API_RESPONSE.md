# Пример API ответа для работы карты

## Структура данных заказа с курьером для карты

### GET /getActiveOrdersMobile

```json
{
  "orders": [
    {
      "_id": "order_123",
      "address": {
        "name": "Дом",
        "actual": "мкр Самал-1, д. 15, кв. 25",
        "link": "https://maps.google.com/...",
        "phone": "+7 777 123 45 67",
        "point": {
          "lat": 43.2267,    // ОБЯЗАТЕЛЬНО для карты
          "lon": 76.8782     // ОБЯЗАТЕЛЬНО для карты
        }
      },
      "courierAggregator": {
        "_id": "courier_456",
        "fullName": "Айбек Жанысов",
        "phone": "+7 701 234 56 78",
        "raiting": 4.8,
        "carNumber": "A 123 BC 02",
        "carType": "A",
        "onTheLine": true,
        "status": "active",
        "point": {
          "lat": 43.2098,    // ОБЯЗАТЕЛЬНО для карты - текущая позиция курьера
          "lon": 76.8845,    // ОБЯЗАТЕЛЬНО для карты - текущая позиция курьера
          "timestamp": "2025-01-15T14:30:00Z"  // Когда обновлены координаты
        }
      },
      "status": "onTheWay",
      "products": {
        "b12": 1,
        "b19": 2
      },
      "sum": 1800,
      "date": {
        "d": "2025-01-15",
        "time": "14:00-16:00"
      }
    }
  ]
}
```

## Что изменилось в коде

### 1. OnTheWayView.tsx
- ✅ Изменили `order.courier` на `order.courierAggregator`
- ✅ Добавили получение координат из `courierAggregator.point.lat/lon`
- ✅ Обновили отображение информации о курьере (fullName, phone, carNumber, raiting)

### 2. navigation.ts (типы)
- ✅ Обновили интерфейс `CourierAggregator` с полями из MongoDB схемы
- ✅ Добавили поле `point` с координатами и timestamp
- ✅ Изменили тип `courierAggregator` в `OrderData`

## Требования к API

### Обязательные поля для карты:
1. **`order.address.point.lat`** - широта адреса доставки
2. **`order.address.point.lon`** - долгота адреса доставки
3. **`order.courierAggregator.point.lat`** - текущая широта курьера
4. **`order.courierAggregator.point.lon`** - текущая долгота курьера
5. **`order.courierAggregator.point.timestamp`** - время последнего обновления координат

### Рекомендуемые поля:
- `order.courierAggregator.fullName` - имя курьера
- `order.courierAggregator.phone` - телефон курьера
- `order.courierAggregator.carNumber` - номер автомобиля
- `order.courierAggregator.raiting` - рейтинг курьера

## API для обновления местоположения курьера

### GET /getCourierLocation
**Запрос:**
```json
{
  "courierId": "courier_456"
}
```

**Ответ:**
```json
{
  "point": {
    "lat": 43.2098,
    "lon": 76.8845,
    "timestamp": "2025-01-15T14:30:00Z"
  }
}
```

### Как работает обновление местоположения:
1. **При загрузке заказа** - используется `order.courierAggregator.point` из API
2. **Каждые 30 секунд** - приложение запрашивает актуальное местоположение через `/getCourierLocation`
3. **При получении новых координат** - карта обновляется автоматически
4. **Расчет расстояния и времени** - пересчитывается в реальном времени

## Fallback логика

### Когда курьер НЕ назначен (`courierAggregator` отсутствует):
- ✅ Карта показывает только адрес доставки
- ✅ Кнопка "Позвонить курьеру" неактивна с текстом "⏳ Ожидается назначение курьера"
- ✅ В информации о курьере отображается "Ожидается назначение курьера"
- ✅ Движение курьера не запускается
- ✅ Маршрут курьера не отображается

### Когда курьер назначен, но координаты отсутствуют:
Карта будет использовать:
1. `currentCourierLocation` (динамическое обновление)
2. `courierAggregatorLocation` (реальные координаты из API)
3. `initialCourierLocation` (центр Алматы: 43.2220, 76.8512)

### Если координаты доставки отсутствуют:
Карта будет использовать:
1. `order.deliveryCoordinates` (если есть)
2. `order.address.point` (реальные координаты из API)
3. `getDeliveryCoordinates()` (тестовые координаты по адресу)

## Примеры API ответов

### Заказ БЕЗ курьера:
```json
{
  "orders": [
    {
      "_id": "order_123",
      "address": {
        "name": "Дом",
        "actual": "мкр Самал-1, д. 15, кв. 25",
        "point": {
          "lat": 43.2267,
          "lon": 76.8782
        }
      },
      "courierAggregator": null,  // Курьер не назначен
      "status": "awaitingOrder"
    }
  ]
}
```

### Заказ С курьером:
```json
{
  "orders": [
    {
      "_id": "order_123",
      "address": {
        "name": "Дом",
        "actual": "мкр Самал-1, д. 15, кв. 25",
        "point": {
          "lat": 43.2267,
          "lon": 76.8782
        }
      },
      "courierAggregator": {
        "_id": "courier_456",
        "fullName": "Айбек Жанысов",
        "phone": "+7 701 234 56 78",
        "point": {
          "lat": 43.2098,
          "lon": 76.8845,
          "timestamp": "2025-01-15T14:30:00Z"
        }
      },
      "status": "onTheWay"
    }
  ]
}
```
