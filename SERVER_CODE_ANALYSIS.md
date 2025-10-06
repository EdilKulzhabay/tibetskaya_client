# 🔍 Анализ серверного кода Push-уведомлений

## ✅ Что сделано ПРАВИЛЬНО:

1. ✅ **Валидация данных** - проверка входных параметров
2. ✅ **Дедупликация** - предотвращение дублирования уведомлений (30 сек)
3. ✅ **Фильтрация токенов** - отсеивание невалидных токенов
4. ✅ **Обработка ошибок** - try-catch блоки для каждого токена
5. ✅ **Приоритет** - высокий приоритет для Android и iOS (apns-priority: 10)
6. ✅ **Логирование** - подробные логи для отладки
7. ✅ **Очистка памяти** - удаление старых записей из Map

---

## ⚠️ ВАЖНЫЕ ЗАМЕЧАНИЯ:

### 1. Формат данных `order`

Ваш код отправляет:
```javascript
data: {
    newStatus: newStatus.toString(),
    ...(newStatus === "newOrder" && order ? { order: JSON.stringify(order) } : {})
}
```

**Проблема:** Данные заказа отправляются только для `newStatus === "newOrder"`, но НЕ для других статусов!

**Решение:** Всегда отправляйте данные заказа:

```javascript
data: {
    newStatus: newStatus.toString(),
    order: order ? JSON.stringify(order) : undefined,
}
```

### 2. Структура данных заказа

Убедитесь, что объект `order` содержит необходимые поля:
```javascript
{
    _id: "или orderId",
    status: "текущий статус",
    client: "clientId",
    sum: 1500,
    // ... другие поля
}
```

---

## 🔧 РЕКОМЕНДУЕМЫЕ УЛУЧШЕНИЯ:

### Улучшение 1: Всегда отправляйте данные заказа

```javascript
export const pushNotificationClient = async (messageTitle, messageBody, notificationTokens, newStatus, order) => {
    try {
        console.log("=== PUSH NOTIFICATION DEBUG ===");
        console.log("notificationTokens =", notificationTokens);
        console.log("messageTitle =", messageTitle);
        console.log("messageBody =", messageBody);
        console.log("newStatus =", newStatus);
        console.log("order =", order);
        console.log("================================");

        // Валидация
        if (!messageTitle || typeof messageTitle !== 'string') {
            throw new Error('Неверный заголовок уведомления');
        }
        if (!messageBody || typeof messageBody !== 'string') {
            throw new Error('Неверное тело уведомления');
        }
        if (!Array.isArray(notificationTokens) || notificationTokens.length === 0) {
            throw new Error('Неверный массив токенов');
        }
        if (!newStatus || typeof newStatus !== 'string') {
            throw new Error('Неверный статус уведомления');
        }

        // Фильтрация токенов
        const validTokens = notificationTokens.filter(token => token && typeof token === 'string' && token.length > 10);
        if (validTokens.length === 0) {
            console.log('❌ Нет валидных токенов для отправки');
            return { success: false, error: 'No valid tokens' };
        }

        // Проверка на дубликаты
        const notificationKey = createNotificationKey(messageTitle, messageBody, validTokens, newStatus, order);
        const now = Date.now();
        
        const lastSent = sentNotifications.get(notificationKey);
        if (lastSent && (now - lastSent) < NOTIFICATION_DEDUP_WINDOW) {
            const remainingTime = Math.ceil((NOTIFICATION_DEDUP_WINDOW - (now - lastSent)) / 1000);
            console.log(`⚠️  ДУБЛИКАТ: Пропускаем (${remainingTime} сек назад)`);
            return { success: false, error: 'Duplicate notification', remaining: remainingTime };
        }

        console.log(`📤 Отправка "${messageTitle}" на ${validTokens.length} устройств`);

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // ОТПРАВКА ПО ВСЕМ ТОКЕНАМ
        for (const token of validTokens) {
            try {
                const message = {
                    token,
                    notification: {
                        title: messageTitle,
                        body: messageBody,
                    },
                    data: {
                        newStatus: newStatus.toString(),
                        // ВАЖНО: Всегда отправляем данные заказа если они есть
                        ...(order ? { 
                            order: JSON.stringify(order),
                            orderId: order._id || order.orderId || 'unknown',
                            orderStatus: order.status || newStatus,
                        } : {})
                    },
                    android: {
                        priority: "high",
                        notification: {
                            sound: "default",
                            channelId: "default",
                        }
                    },
                    apns: {
                        headers: {
                            "apns-priority": "10",
                        },
                        payload: {
                            aps: {
                                alert: {
                                    title: messageTitle,
                                    body: messageBody,
                                },
                                sound: "default",
                                badge: 1,
                                contentAvailable: true,
                            },
                        },
                    },
                };

                const response = await admin.messaging().send(message);
                console.log(`✅ Успешно отправлено на ${token.slice(-10)}:`, response);
                successCount++;
            } catch (tokenError) {
                console.error(`❌ Ошибка для токена ${token.slice(-10)}:`, tokenError.code || tokenError.message);
                errorCount++;
                errors.push({
                    token: token.slice(-10),
                    error: tokenError.code || tokenError.message
                });
                
                // Если токен невалидный - возвращаем его для удаления из БД
                if (tokenError.code === 'messaging/invalid-registration-token' ||
                    tokenError.code === 'messaging/registration-token-not-registered') {
                    console.log(`🗑️  Токен ${token.slice(-10)} нужно удалить из БД`);
                }
            }
        }

        // Отмечаем как отправленное
        if (successCount > 0) {
            sentNotifications.set(notificationKey, now);
            console.log(`✅ ИТОГО: ${successCount} успешно, ${errorCount} ошибок`);
            
            // Очистка старых записей
            const cleanupTime = now - (5 * 60 * 1000);
            for (const [key, timestamp] of sentNotifications.entries()) {
                if (timestamp < cleanupTime) {
                    sentNotifications.delete(key);
                }
            }
            
            return {
                success: true,
                successCount,
                errorCount,
                errors: errorCount > 0 ? errors : undefined
            };
        } else {
            console.log(`❌ Не удалось отправить ни на одно устройство`);
            return {
                success: false,
                error: 'All tokens failed',
                errors
            };
        }

    } catch (error) {
        console.error("❌ КРИТИЧЕСКАЯ ОШИБКА:", error);
        return {
            success: false,
            error: error.message,
            stack: error.stack
        };
    }
}
```

---

## 📊 Пример вызова на сервере:

### При создании нового заказа:

```javascript
// После создания заказа в БД
const newOrder = await Order.create({ /* данные заказа */ });

// Получаем FCM токен клиента
const client = await Client.findById(newOrder.client);

if (client?.fcmToken) {
    await pushNotificationClient(
        "🆕 Новый заказ",
        `Ваш заказ #${newOrder._id.toString().slice(-6)} создан`,
        [client.fcmToken], // массив токенов
        "newOrder",        // статус
        {                  // данные заказа
            _id: newOrder._id.toString(),
            orderId: newOrder._id.toString(),
            status: newOrder.status,
            sum: newOrder.sum,
            client: newOrder.client.toString(),
            address: newOrder.address,
            products: newOrder.products,
            date: newOrder.date,
            createdAt: newOrder.createdAt,
        }
    );
}
```

### При обновлении статуса заказа:

```javascript
// После обновления статуса в БД
const order = await Order.findByIdAndUpdate(
    orderId,
    { status: newStatus, updatedAt: new Date() },
    { new: true }
);

const client = await Client.findById(order.client);

if (client?.fcmToken) {
    // Определяем сообщение для каждого статуса
    const statusMessages = {
        'pending': { title: '📦 Заказ принят', body: 'Ваш заказ принят в обработку' },
        'accepted': { title: '✅ Заказ подтвержден', body: 'Заказ подтвержден и готовится к отправке' },
        'preparing': { title: '📋 Заказ готовится', body: 'Ваш заказ готовится к отправке' },
        'on_way': { title: '🚗 Заказ в пути', body: 'Курьер везет ваш заказ' },
        'delivered': { title: '🎉 Заказ доставлен', body: 'Ваш заказ успешно доставлен!' },
        'cancelled': { title: '❌ Заказ отменен', body: 'Заказ был отменен' },
    };

    const message = statusMessages[newStatus] || { 
        title: '📬 Обновление заказа', 
        body: 'Статус вашего заказа изменен' 
    };

    await pushNotificationClient(
        message.title,
        `${message.body} #${order._id.toString().slice(-6)}`,
        [client.fcmToken],
        newStatus,
        {
            _id: order._id.toString(),
            orderId: order._id.toString(),
            status: newStatus,
            sum: order.sum,
            client: order.client.toString(),
            address: order.address,
            products: order.products,
            date: order.date,
            updatedAt: new Date().toISOString(),
        }
    );
}
```

---

## 🧪 Тестирование:

### Тест 1: Проверка отправки

```javascript
// test-notification.js
import { pushNotificationClient } from './путь/к/вашему/файлу';
import Client from './models/Client';
import mongoose from 'mongoose';

async function testPush() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Находим клиента с FCM токеном
    const client = await Client.findOne({ 
        fcmToken: { $exists: true, $ne: null } 
    });
    
    if (!client) {
        console.log('❌ Клиент с FCM токеном не найден');
        process.exit(1);
    }
    
    console.log('📱 Тест для клиента:', client.mail);
    console.log('🔑 FCM Token:', client.fcmToken);
    
    // Тестовые данные заказа
    const testOrder = {
        _id: '67890abcdef',
        orderId: '67890abcdef',
        status: 'on_way',
        sum: 2500,
        client: client._id.toString(),
        address: {
            city: 'Алматы',
            street: 'Тестовая',
            building: '1',
        },
        products: {
            water12: 3,
            water19: 2,
        },
        date: {
            date: new Date(),
        },
        updatedAt: new Date().toISOString(),
    };
    
    // Отправляем тестовое уведомление
    const result = await pushNotificationClient(
        '🚗 Заказ в пути',
        'Курьер везет ваш заказ #890abc',
        [client.fcmToken],
        'on_way',
        testOrder
    );
    
    console.log('📤 Результат отправки:', JSON.stringify(result, null, 2));
    
    if (result.success) {
        console.log('✅ Тест пройден успешно!');
    } else {
        console.log('❌ Тест провален:', result.error);
    }
    
    process.exit(0);
}

testPush().catch(console.error);
```

Запуск:
```bash
node test-notification.js
```

---

## 📱 Что происходит в приложении:

1. **Приложение запущено (foreground):**
   - ✅ Получает уведомление
   - ✅ Вызывается `handleNotificationData()`
   - ✅ Обновляется локальное хранилище
   - ✅ Показывается Alert с кнопками

2. **Приложение в фоне (background):**
   - ✅ Получает уведомление
   - ✅ Показывается в шторке уведомлений
   - ✅ При клике: вызывается `onNotificationOpenedApp()`
   - ✅ Обновляется локальное хранилище
   - ✅ Можно открыть экран заказа

3. **Приложение закрыто:**
   - ✅ Получает уведомление
   - ✅ При клике: приложение запускается
   - ✅ Вызывается `getInitialNotification()`
   - ✅ Обновляется локальное хранилище
   - ✅ Открывается экран заказа через 1 сек

---

## ✅ Проверочный чек-лист:

### Сервер:
- [ ] Данные `order` всегда отправляются (не только для newOrder)
- [ ] `order._id` или `order.orderId` присутствует
- [ ] `order.status` соответствует `newStatus`
- [ ] FCM токен валидный и не пустой
- [ ] Логи показывают успешную отправку

### Приложение:
- [ ] `handleNotificationData()` вызывается для всех типов
- [ ] Данные сохраняются в AsyncStorage
- [ ] При клике открывается нужный экран
- [ ] Логи показывают получение и обработку

---

## 🎯 ИТОГО:

Ваш код на сервере **работает корректно**, но нужно:

1. ✅ **Всегда отправлять данные заказа** (не только для newOrder)
2. ✅ **Включить `orderId` и `orderStatus` в data**
3. ✅ **Обрабатывать невалидные токены** (удалять из БД)
4. ✅ **Возвращать результат** для логирования

Приложение **уже готово** принимать и обрабатывать ваши уведомления! 🎉

