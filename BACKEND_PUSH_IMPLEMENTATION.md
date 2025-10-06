# 🚀 Реализация Push-уведомлений на Node.js Backend

## 📋 Обзор

Это руководство показывает, как настроить отправку push-уведомлений с вашего Node.js сервера когда статус заказа меняется.

**Ваш API:** `https://api.tibetskayacrm.kz`

---

## 1️⃣ Установка Firebase Admin SDK на сервере

### Шаг 1: Установите пакет

```bash
npm install firebase-admin
```

### Шаг 2: Получите Service Account Key

1. Перейдите в [Firebase Console](https://console.firebase.google.com/)
2. Выберите ваш проект
3. **Project Settings** (шестеренка) → **Service Accounts**
4. Нажмите **Generate new private key**
5. Сохраните файл как `firebase-service-account.json` в корне вашего проекта
6. **ВАЖНО**: Добавьте этот файл в `.gitignore`!

```
# .gitignore
firebase-service-account.json
```

---

## 2️⃣ Настройка Firebase Admin на сервере

Создайте файл `src/services/firebaseAdmin.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../../firebase-service-account.json');

// Инициализация Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'tibetskayaclientapp-88b45', // Ваш Project ID из Firebase Console
});

// Экспортируем messaging
const messaging = admin.messaging();

module.exports = {
  admin,
  messaging,
};
```

---

## 3️⃣ Создание сервиса для отправки уведомлений

Создайте файл `src/services/pushNotificationService.js`:

```javascript
const { messaging } = require('./firebaseAdmin');

class PushNotificationService {
  /**
   * Отправка уведомления одному пользователю
   */
  async sendToUser(fcmToken, notification, data = {}) {
    try {
      const message = {
        token: fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          ...data,
          // Добавляем timestamp для уникальности
          timestamp: Date.now().toString(),
        },
        // Для iOS
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              badge: 1,
              sound: 'default',
            },
          },
        },
        // Для Android
        android: {
          notification: {
            title: notification.title,
            body: notification.body,
            sound: 'default',
            channelId: 'default',
          },
          priority: 'high',
        },
      };

      const response = await messaging.send(message);
      console.log('✅ Уведомление отправлено:', response);
      return { success: true, messageId: response };
    } catch (error) {
      console.error('❌ Ошибка отправки уведомления:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Отправка уведомления нескольким пользователям
   */
  async sendToMultipleUsers(fcmTokens, notification, data = {}) {
    try {
      // Фильтруем пустые токены
      const validTokens = fcmTokens.filter(token => token && token.length > 0);
      
      if (validTokens.length === 0) {
        console.log('⚠️ Нет валидных FCM токенов');
        return { success: false, error: 'No valid tokens' };
      }

      const message = {
        tokens: validTokens,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          ...data,
          timestamp: Date.now().toString(),
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              badge: 1,
              sound: 'default',
            },
          },
        },
        android: {
          notification: {
            title: notification.title,
            body: notification.body,
            sound: 'default',
            channelId: 'default',
          },
          priority: 'high',
        },
      };

      const response = await messaging.sendEachForMulticast(message);
      console.log('✅ Уведомления отправлены:', {
        success: response.successCount,
        failure: response.failureCount,
      });

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses,
      };
    } catch (error) {
      console.error('❌ Ошибка отправки уведомлений:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Отправка уведомления об изменении статуса заказа
   */
  async sendOrderStatusUpdate(clientFcmToken, order) {
    const statusMessages = {
      'pending': {
        title: '📦 Заказ принят',
        body: `Заказ #${order._id.slice(-6)} принят в обработку`,
      },
      'accepted': {
        title: '✅ Заказ подтвержден',
        body: `Заказ #${order._id.slice(-6)} подтвержден и готовится к отправке`,
      },
      'preparing': {
        title: '📋 Заказ готовится',
        body: `Ваш заказ #${order._id.slice(-6)} готовится к отправке`,
      },
      'on_way': {
        title: '🚗 Заказ в пути',
        body: `Курьер везет ваш заказ #${order._id.slice(-6)}`,
      },
      'delivered': {
        title: '🎉 Заказ доставлен',
        body: `Заказ #${order._id.slice(-6)} успешно доставлен!`,
      },
      'cancelled': {
        title: '❌ Заказ отменен',
        body: `Заказ #${order._id.slice(-6)} был отменен`,
      },
    };

    const notification = statusMessages[order.status] || {
      title: '📬 Обновление заказа',
      body: `Статус заказа #${order._id.slice(-6)} изменен`,
    };

    const data = {
      type: 'order_status_update',
      orderId: order._id,
      status: order.status,
      orderData: JSON.stringify({
        _id: order._id,
        status: order.status,
        sum: order.sum.toString(),
        address: JSON.stringify(order.address),
        products: JSON.stringify(order.products),
        date: JSON.stringify(order.date),
        updatedAt: new Date().toISOString(),
      }),
    };

    return this.sendToUser(clientFcmToken, notification, data);
  }

  /**
   * Отправка уведомления о новом заказе (для курьеров/менеджеров)
   */
  async sendNewOrderNotification(fcmTokens, order) {
    const notification = {
      title: '🆕 Новый заказ',
      body: `Новый заказ на сумму ${order.sum} тг`,
    };

    const data = {
      type: 'new_order',
      orderId: order._id,
      orderData: JSON.stringify(order),
    };

    return this.sendToMultipleUsers(fcmTokens, notification, data);
  }
}

module.exports = new PushNotificationService();
```

---

## 4️⃣ Обновление схемы Client для хранения FCM токена

В вашей модели Client добавьте поле для FCM токена:

```javascript
// models/Client.js (или где у вас определена схема клиента)

const clientSchema = new mongoose.Schema({
  // ... существующие поля ...
  
  // FCM токен для push-уведомлений
  fcmToken: {
    type: String,
    default: null,
  },
  
  // Платформа устройства
  devicePlatform: {
    type: String,
    enum: ['ios', 'android'],
    default: null,
  },
  
  // ... остальные поля ...
});
```

---

## 5️⃣ API endpoint для сохранения FCM токена

Создайте endpoint для сохранения FCM токена от клиента:

```javascript
// routes/client.js или controllers/clientController.js

/**
 * POST /api/user/fcm-token
 * Сохранение FCM токена клиента
 */
router.post('/user/fcm-token', authenticateToken, async (req, res) => {
  try {
    const { userId, fcmToken, platform } = req.body;

    // Валидация
    if (!userId || !fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'userId и fcmToken обязательны',
      });
    }

    // Обновляем клиента
    const client = await Client.findByIdAndUpdate(
      userId,
      {
        fcmToken: fcmToken,
        devicePlatform: platform || 'ios',
      },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Клиент не найден',
      });
    }

    console.log('✅ FCM токен сохранен для клиента:', client.mail);

    res.json({
      success: true,
      message: 'FCM токен успешно сохранен',
    });
  } catch (error) {
    console.error('Ошибка сохранения FCM токена:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
      error: error.message,
    });
  }
});
```

---

## 6️⃣ Отправка уведомления при изменении статуса заказа

Добавьте отправку уведомления в вашу логику обновления заказа:

```javascript
// controllers/orderController.js

const pushNotificationService = require('../services/pushNotificationService');

/**
 * Обновление статуса заказа
 */
async function updateOrderStatus(orderId, newStatus) {
  try {
    // Обновляем заказ
    const order = await Order.findByIdAndUpdate(
      orderId,
      { 
        status: newStatus,
        updatedAt: new Date(),
      },
      { new: true }
    ).populate('client');

    if (!order) {
      throw new Error('Заказ не найден');
    }

    // Получаем FCM токен клиента
    const client = await Client.findById(order.client);
    
    if (client && client.fcmToken) {
      // Отправляем push-уведомление
      console.log('📤 Отправка push-уведомления клиенту:', client.mail);
      
      await pushNotificationService.sendOrderStatusUpdate(
        client.fcmToken,
        order
      );
    } else {
      console.log('⚠️ FCM токен не найден для клиента:', client?.mail);
    }

    return order;
  } catch (error) {
    console.error('Ошибка обновления статуса заказа:', error);
    throw error;
  }
}

/**
 * API endpoint для обновления статуса
 */
router.patch('/orders/:orderId/status', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await updateOrderStatus(orderId, status);

    res.json({
      success: true,
      message: 'Статус заказа обновлен',
      order,
    });
  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления статуса',
      error: error.message,
    });
  }
});
```

---

## 7️⃣ Обновление клиентского приложения для обработки уведомлений

Обновите `src/services/pushNotifications.ts` для обработки данных заказа:

```typescript
// Добавьте в setupNotificationHandlers()

setupNotificationHandlers() {
  // ... существующий код ...

  // Обработчик для уведомлений когда приложение на переднем плане
  messaging().onMessage(async remoteMessage => {
    console.log('📨 Уведомление на переднем плане:', remoteMessage);
    
    // Если это обновление заказа
    if (remoteMessage.data?.type === 'order_status_update') {
      const orderData = JSON.parse(remoteMessage.data.orderData);
      
      // Можно обновить локальное состояние или показать alert
      if (Platform.OS === 'ios') {
        Alert.alert(
          remoteMessage.notification?.title || 'Обновление заказа',
          remoteMessage.notification?.body || '',
          [
            {
              text: 'Просмотреть',
              onPress: () => {
                // Навигация к экрану заказа
                // NavigationService.navigate('OrderStatus', { orderId: orderData._id });
              },
            },
            { text: 'OK' },
          ]
        );
      }
    }
  });

  // Обработчик для клика по уведомлению
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('👆 Клик по уведомлению:', remoteMessage);
    
    if (remoteMessage.data?.type === 'order_status_update') {
      const orderId = remoteMessage.data.orderId;
      // Навигация к экрану заказа
      // NavigationService.navigate('OrderStatus', { orderId });
    }
  });

  // Проверка, было ли приложение открыто через уведомление
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('🚀 Приложение открыто через уведомление:', remoteMessage);
        
        if (remoteMessage.data?.type === 'order_status_update') {
          const orderId = remoteMessage.data.orderId;
          // Навигация к экрану заказа
          // setTimeout(() => {
          //   NavigationService.navigate('OrderStatus', { orderId });
          // }, 1000);
        }
      }
    });
}
```

---

## 8️⃣ Тестирование

### Тест 1: Проверка сохранения FCM токена

```bash
# Проверьте в MongoDB, что токен сохранился
db.clients.findOne({ mail: "test@example.com" }, { fcmToken: 1, devicePlatform: 1 })
```

### Тест 2: Отправка тестового уведомления

```javascript
// test-push.js
const pushNotificationService = require('./src/services/pushNotificationService');

async function testPush() {
  const fcmToken = 'ВСТАВЬТЕ_FCM_ТОКЕН_КЛИЕНТА';
  
  const result = await pushNotificationService.sendToUser(
    fcmToken,
    {
      title: 'Тест',
      body: 'Тестовое уведомление',
    },
    {
      type: 'test',
      data: 'test data',
    }
  );
  
  console.log('Результат:', result);
}

testPush();
```

Запуск:
```bash
node test-push.js
```

---

## 9️⃣ Структура базы данных

### Коллекция Clients:

```javascript
{
  _id: ObjectId("..."),
  fullName: "Иван Иванов",
  mail: "ivan@example.com",
  phone: "+77771234567",
  fcmToken: "eXaMpLe_FcM_ToKeN...",  // <-- Новое поле
  devicePlatform: "ios",              // <-- Новое поле
  // ... другие поля
}
```

---

## 🔟 Обработка ошибок

### Обработка невалидных токенов:

```javascript
async sendOrderStatusUpdate(clientFcmToken, order) {
  try {
    const result = await this.sendToUser(clientFcmToken, notification, data);
    
    // Если токен невалидный или устарел
    if (!result.success && result.error.includes('registration-token-not-registered')) {
      console.log('❌ FCM токен устарел, удаляем его из базы');
      
      // Удаляем устаревший токен
      await Client.findOneAndUpdate(
        { fcmToken: clientFcmToken },
        { fcmToken: null }
      );
    }
    
    return result;
  } catch (error) {
    console.error('Ошибка отправки уведомления:', error);
    return { success: false, error: error.message };
  }
}
```

---

## 📊 Мониторинг

### Логирование уведомлений:

```javascript
// Создайте модель для логов уведомлений
const notificationLogSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  type: String,
  title: String,
  body: String,
  success: Boolean,
  error: String,
  sentAt: { type: Date, default: Date.now },
});

// Сохраняйте каждую отправку
async sendToUser(fcmToken, notification, data) {
  const result = await messaging.send(message);
  
  // Сохраняем лог
  await NotificationLog.create({
    clientId: data.clientId,
    orderId: data.orderId,
    type: data.type,
    title: notification.title,
    body: notification.body,
    success: true,
    sentAt: new Date(),
  });
  
  return result;
}
```

---

## ✅ Чек-лист внедрения:

- [ ] Установлен `firebase-admin` на сервере
- [ ] Получен Service Account Key из Firebase Console
- [ ] Создан `firebaseAdmin.js` с инициализацией
- [ ] Создан `pushNotificationService.js`
- [ ] Добавлено поле `fcmToken` в схему Client
- [ ] Создан endpoint `/api/user/fcm-token`
- [ ] Обновлена логика изменения статуса заказа
- [ ] Клиентское приложение обрабатывает уведомления
- [ ] Протестирована отправка уведомлений
- [ ] Настроен мониторинг и логирование

---

## 🚀 Готово!

Теперь ваш сервер будет автоматически отправлять push-уведомления клиентам при изменении статуса заказа!

