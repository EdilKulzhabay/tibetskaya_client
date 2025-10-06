# ⚡ Быстрая настройка Push-уведомлений

## ✅ Что УЖЕ ГОТОВО в приложении:

1. ✅ Firebase SDK установлен
2. ✅ Push-сервис создан и настроен
3. ✅ AppDelegate.swift настроен
4. ✅ Приложение запускается без ошибок
5. ✅ FCM токен генерируется автоматически

---

## 🔴 Что нужно сделать НА СЕРВЕРЕ (Node.js):

### 1. Установите Firebase Admin SDK

```bash
cd /path/to/your/backend
npm install firebase-admin
```

### 2. Получите Service Account Key

1. Откройте: https://console.firebase.google.com/
2. Выберите проект `tibetskayaclientapp-88b45`
3. **⚙️ Project Settings** → **Service Accounts**
4. **Generate new private key** → Скачайте JSON файл
5. Сохраните как `firebase-service-account.json` в корне сервера
6. Добавьте в `.gitignore`:
   ```
   firebase-service-account.json
   ```

### 3. Создайте файлы на сервере

📁 **src/services/firebaseAdmin.js:**
```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'tibetskayaclientapp-88b45',
});

const messaging = admin.messaging();

module.exports = { admin, messaging };
```

📁 **src/services/pushNotificationService.js:**
```javascript
const { messaging } = require('./firebaseAdmin');

class PushNotificationService {
  async sendOrderStatusUpdate(clientFcmToken, order) {
    const statusMessages = {
      'pending': { title: '📦 Заказ принят', body: `Заказ #${order._id.slice(-6)} принят` },
      'accepted': { title: '✅ Заказ подтвержден', body: `Заказ #${order._id.slice(-6)} подтвержден` },
      'on_way': { title: '🚗 Заказ в пути', body: `Курьер везет ваш заказ #${order._id.slice(-6)}` },
      'delivered': { title: '🎉 Доставлено', body: `Заказ #${order._id.slice(-6)} доставлен!` },
      'cancelled': { title: '❌ Отменен', body: `Заказ #${order._id.slice(-6)} отменен` },
    };

    const notification = statusMessages[order.status] || {
      title: '📬 Обновление', body: `Статус заказа изменен`
    };

    const message = {
      token: clientFcmToken,
      notification: { title: notification.title, body: notification.body },
      data: {
        type: 'order_status_update',
        orderId: order._id,
        status: order.status,
      },
      apns: { payload: { aps: { alert: notification, badge: 1, sound: 'default' }}},
      android: { notification: { ...notification, sound: 'default' }, priority: 'high' },
    };

    try {
      const response = await messaging.send(message);
      console.log('✅ Push отправлен:', response);
      return { success: true };
    } catch (error) {
      console.error('❌ Ошибка push:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new PushNotificationService();
```

### 4. Обновите схему Client

```javascript
// models/Client.js
const ClientSchema = new mongoose.Schema({
  // ... существующие поля ...
  
  fcmToken: { type: String, default: null },
  devicePlatform: { type: String, enum: ['ios', 'android', null], default: null },
  fcmTokenUpdatedAt: { type: Date, default: null },
});
```

### 5. Добавьте endpoint для сохранения токена

```javascript
// routes/client.js
router.post('/saveFcmToken', async (req, res) => {
  try {
    const { mail, fcmToken, platform } = req.body;

    if (!mail || !fcmToken) {
      return res.status(400).json({ success: false, message: 'mail и fcmToken обязательны' });
    }

    const client = await Client.findOneAndUpdate(
      { mail },
      { fcmToken, devicePlatform: platform || 'ios', fcmTokenUpdatedAt: new Date() },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ success: false, message: 'Клиент не найден' });
    }

    console.log('✅ FCM токен сохранен для:', mail);
    res.json({ success: true, message: 'Токен сохранен' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 6. Добавьте отправку при изменении статуса

```javascript
// Где бы вы ни обновляли статус заказа:
const pushService = require('../services/pushNotificationService');

async function updateOrderStatus(orderId, newStatus) {
  const order = await Order.findByIdAndUpdate(
    orderId,
    { status: newStatus, updatedAt: new Date() },
    { new: true }
  );

  // Отправляем push
  const client = await Client.findById(order.client);
  if (client?.fcmToken) {
    await pushService.sendOrderStatusUpdate(client.fcmToken, order);
  }

  return order;
}
```

---

## 📱 Что нужно обновить В ПРИЛОЖЕНИИ:

### Обновите `src/hooks/useAuth.ts`

Добавьте в функцию `saveUserData`:

```typescript
const saveUserData = useCallback(async (responseData: any) => {
  try {
    // ... существующий код ...
    
    // ДОБАВЬТЕ ЭТИ СТРОКИ:
    await AsyncStorage.setItem('userMail', clientData.mail);
    pushNotificationService.setUserId(clientData._id);
    
    // ... остальной код ...
  } catch (error) {
    // ...
  }
}, []);
```

Добавьте в функцию `logout`:

```typescript
const logout = useCallback(async () => {
  try {
    // ДОБАВЬТЕ ЭТИ СТРОКИ:
    await pushNotificationService.clearToken();
    await AsyncStorage.removeItem('userMail');
    
    // ... остальная логика выхода ...
  } catch (error) {
    // ...
  }
}, []);
```

---

## 🧪 Тестирование

### 1. Проверьте сохранение токена

После логина в приложении, проверьте в MongoDB:

```javascript
db.clients.findOne({ mail: "ваш@email.com" }, { fcmToken: 1, devicePlatform: 1 })
```

Должны увидеть FCM токен.

### 2. Тестовая отправка

Создайте `test-push.js`:

```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const pushService = require('./src/services/pushNotificationService');
const Client = require('./models/Client');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const client = await Client.findOne({ fcmToken: { $ne: null } });
  console.log('Тест для:', client.mail);
  
  const testOrder = {
    _id: '507f1f77bcf86cd799439011',
    status: 'on_way',
  };
  
  const result = await pushService.sendOrderStatusUpdate(client.fcmToken, testOrder);
  console.log('Результат:', result);
  
  process.exit(0);
}

test();
```

Запустите:
```bash
node test-push.js
```

---

## 📊 Логи для проверки

### В приложении (iOS):
```
🔔 Инициализация push-уведомлений...
✅ Push notifications authorized
📱 APNs token registered
📱 FCM Token: eXaMpLe...
📤 Отправка FCM токена на сервер для: user@example.com
✅ FCM токен отправлен на сервер
```

### На сервере:
```
📱 Сохранение FCM токена для: user@example.com
✅ FCM токен сохранен для: user@example.com
📝 Обновление статуса заказа 123 -> on_way
📤 Отправка push-уведомления...
✅ Push отправлен: projects/.../messages/...
```

---

## 🎯 Итоговый чеклист:

### Backend (Node.js):
- [ ] `npm install firebase-admin`
- [ ] Service Account Key скачан
- [ ] `firebaseAdmin.js` создан
- [ ] `pushNotificationService.js` создан
- [ ] Схема Client обновлена (fcmToken, devicePlatform)
- [ ] Endpoint `/saveFcmToken` добавлен
- [ ] Функция `updateOrderStatus` отправляет push
- [ ] Тест `test-push.js` работает

### Frontend (React Native):
- [ ] `useAuth.ts` обновлен (saveUserData, logout)
- [ ] После логина токен сохраняется на сервере
- [ ] При выходе токен удаляется
- [ ] Уведомления приходят на устройство

---

## 📚 Полная документация:

- **BACKEND_PUSH_IMPLEMENTATION.md** - Детальное руководство по backend
- **BACKEND_INTEGRATION_EXAMPLE.md** - Примеры кода для вашего проекта
- **FIREBASE_SETUP_GUIDE.md** - Настройка Firebase Console
- **SETUP_COMPLETE.md** - Полная инструкция с чеклистами

---

## 🚀 Готово!

Теперь при изменении статуса заказа клиент автоматически получит push-уведомление! 🎉

