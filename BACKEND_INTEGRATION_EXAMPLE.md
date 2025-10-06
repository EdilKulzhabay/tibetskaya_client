# 🔧 Примеры интеграции для вашего проекта

## 📍 Ваша текущая структура API

**Base URL:** `https://api.tibetskayacrm.kz`

**Существующие endpoints:**
- `/getClientDataMobile` - получение данных клиента
- `/clientLogin` - вход клиента
- `/clientRegister` - регистрация клиента
- `/addOrderClientMobile` - создание заказа
- `/getActiveOrdersMobile` - активные заказы
- `/getClientOrdersMobile` - история заказов
- `/updateClientDataMobile` - обновление данных

---

## 1️⃣ Добавьте новый endpoint для FCM токена

```javascript
// routes/client.js или ваш файл с роутами

/**
 * POST /saveFcmToken
 * Сохранение FCM токена клиента (совместимо с вашим стилем API)
 */
router.post('/saveFcmToken', async (req, res) => {
  try {
    const { mail, fcmToken, platform } = req.body;

    console.log('📱 Сохранение FCM токена для:', mail);

    // Валидация
    if (!mail || !fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'mail и fcmToken обязательны',
      });
    }

    // Находим и обновляем клиента по email
    const client = await Client.findOneAndUpdate(
      { mail: mail },
      {
        fcmToken: fcmToken,
        devicePlatform: platform || 'ios',
        fcmTokenUpdatedAt: new Date(),
      },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Клиент не найден',
      });
    }

    console.log('✅ FCM токен сохранен для:', mail);

    res.json({
      success: true,
      message: 'FCM токен успешно сохранен',
      clientData: {
        mail: client.mail,
        fcmToken: client.fcmToken,
        platform: client.devicePlatform,
      },
    });
  } catch (error) {
    console.error('❌ Ошибка сохранения FCM токена:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
      error: error.message,
    });
  }
});
```

---

## 2️⃣ Обновите схему Client

```javascript
// models/Client.js

const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  // ... ваши существующие поля ...
  fullName: String,
  mail: { type: String, unique: true, required: true },
  phone: String,
  password: String,
  bonus: { type: Number, default: 0 },
  price12: Number,
  price19: Number,
  status: String,
  cart: mongoose.Schema.Types.Mixed,
  addresses: [mongoose.Schema.Types.Mixed],
  createdAt: { type: Date, default: Date.now },
  isStartedHydration: { type: Boolean, default: false },
  
  // === НОВЫЕ ПОЛЯ ДЛЯ PUSH-УВЕДОМЛЕНИЙ ===
  fcmToken: {
    type: String,
    default: null,
  },
  devicePlatform: {
    type: String,
    enum: ['ios', 'android', null],
    default: null,
  },
  fcmTokenUpdatedAt: {
    type: Date,
    default: null,
  },
  // === КОНЕЦ НОВЫХ ПОЛЕЙ ===
  
  // ... остальные поля ...
});

module.exports = mongoose.model('Client', ClientSchema);
```

---

## 3️⃣ Обновите функцию изменения статуса заказа

Если у вас есть функция для обновления статуса заказа, добавьте туда отправку уведомления:

```javascript
// controllers/orderController.js или где у вас логика заказов

const pushNotificationService = require('../services/pushNotificationService');

/**
 * Функция для обновления статуса заказа
 * (вызывается из ваших существующих endpoint'ов)
 */
async function updateOrderStatus(orderId, newStatus, updatedBy = null) {
  try {
    console.log(`📝 Обновление статуса заказа ${orderId} -> ${newStatus}`);
    
    // 1. Обновляем заказ в БД
    const order = await Order.findByIdAndUpdate(
      orderId,
      { 
        status: newStatus,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!order) {
      throw new Error('Заказ не найден');
    }

    // 2. Получаем данные клиента по client ID в заказе
    const client = await Client.findById(order.client);
    
    if (!client) {
      console.log('⚠️ Клиент не найден для заказа:', orderId);
      return order;
    }

    console.log('👤 Клиент найден:', client.mail);

    // 3. Проверяем наличие FCM токена
    if (client.fcmToken) {
      console.log('📤 Отправка push-уведомления...');
      
      // 4. Отправляем push-уведомление
      const pushResult = await pushNotificationService.sendOrderStatusUpdate(
        client.fcmToken,
        order
      );

      if (pushResult.success) {
        console.log('✅ Push-уведомление отправлено успешно');
      } else {
        console.log('❌ Ошибка отправки push:', pushResult.error);
        
        // Если токен невалидный - удаляем его
        if (pushResult.error && pushResult.error.includes('registration-token-not-registered')) {
          console.log('🗑️ Удаление устаревшего FCM токена');
          await Client.findByIdAndUpdate(client._id, {
            fcmToken: null,
            devicePlatform: null,
          });
        }
      }
    } else {
      console.log('⚠️ FCM токен не найден у клиента:', client.mail);
    }

    return order;
  } catch (error) {
    console.error('❌ Ошибка обновления статуса:', error);
    throw error;
  }
}

/**
 * Endpoint для обновления статуса заказа
 * POST /updateOrderStatus
 */
router.post('/updateOrderStatus', async (req, res) => {
  try {
    const { orderId, status } = req.body;

    // Валидация
    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        message: 'orderId и status обязательны',
      });
    }

    // Обновляем статус (с автоматической отправкой push)
    const order = await updateOrderStatus(orderId, status);

    res.json({
      success: true,
      message: 'Статус заказа обновлен и уведомление отправлено',
      order,
    });
  } catch (error) {
    console.error('❌ Ошибка:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления статуса',
      error: error.message,
    });
  }
});

module.exports = { updateOrderStatus };
```

---

## 4️⃣ Интеграция с существующими эндпоинтами

### Вариант A: Добавьте в существующий endpoint обновления заказа

Если у вас уже есть endpoint для обновления заказов, просто добавьте вызов функции отправки:

```javascript
// Ваш существующий код обновления заказа
router.post('/someExistingOrderUpdate', async (req, res) => {
  try {
    // ... ваша существующая логика ...
    
    const order = await Order.findByIdAndUpdate(orderId, updates);
    
    // === ДОБАВЬТЕ ЭТО ===
    // Проверяем, изменился ли статус
    if (updates.status && updates.status !== order.status) {
      const client = await Client.findById(order.client);
      
      if (client?.fcmToken) {
        await pushNotificationService.sendOrderStatusUpdate(
          client.fcmToken,
          { ...order.toObject(), status: updates.status }
        );
      }
    }
    // === КОНЕЦ ===
    
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## 5️⃣ Обновление клиентского приложения

### Обновите `src/services/pushNotifications.ts`:

```typescript
// Измените API_URL на ваш
const API_URL = 'https://api.tibetskayacrm.kz';

// Обновите функцию sendTokenToServer
async sendTokenToServer(token: string): Promise<void> {
  try {
    if (!this.userId) {
      console.log('⚠️ userId не установлен, токен не отправлен на сервер');
      return;
    }

    // Получаем email пользователя из AsyncStorage
    const userMail = await AsyncStorage.getItem('userMail');
    
    if (!userMail) {
      console.log('⚠️ Email пользователя не найден');
      return;
    }

    // Отправляем на ваш endpoint
    await axios.post(
      `${API_URL}/saveFcmToken`,
      {
        mail: userMail,
        fcmToken: token,
        platform: Platform.OS,
      }
    );
    
    console.log('✅ FCM токен отправлен на сервер');
  } catch (error) {
    console.error('Ошибка при отправке токена на сервер:', error);
  }
}
```

### Обновите `src/hooks/useAuth.ts`:

```typescript
// В функции saveUserData, после сохранения пользователя
const saveUserData = useCallback(async (responseData: any) => {
  try {
    // ... существующий код сохранения ...
    
    // Сохраняем email для push-уведомлений
    await AsyncStorage.setItem('userMail', clientData.mail);
    
    // Инициализируем push-уведомления с userId
    pushNotificationService.setUserId(clientData._id);
    
    // ... остальной код ...
  } catch (error) {
    // ...
  }
}, []);

// В функции logout
const logout = useCallback(async () => {
  try {
    await pushNotificationService.clearToken();
    await AsyncStorage.removeItem('userMail');
    // ... остальная логика выхода ...
  } catch (error) {
    // ...
  }
}, []);
```

---

## 6️⃣ Тестирование

### Тест 1: Проверка сохранения токена

```bash
# В MongoDB или через Compass
db.clients.findOne({ mail: "test@example.com" })

# Должны увидеть:
{
  mail: "test@example.com",
  fcmToken: "eXaMpLe_FcM_ToKeN...",
  devicePlatform: "ios",
  fcmTokenUpdatedAt: ISODate("2025-10-06T...")
}
```

### Тест 2: Отправка тестового уведомления

Создайте файл `test-push.js` в корне сервера:

```javascript
// test-push.js
require('dotenv').config();
const mongoose = require('mongoose');
const pushNotificationService = require('./src/services/pushNotificationService');
const Client = require('./models/Client');

async function testPushNotification() {
  try {
    // Подключаемся к БД
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Подключено к MongoDB');

    // Находим клиента с FCM токеном
    const client = await Client.findOne({ 
      fcmToken: { $exists: true, $ne: null } 
    });

    if (!client) {
      console.log('❌ Клиент с FCM токеном не найден');
      process.exit(1);
    }

    console.log('📱 Тест отправки для:', client.mail);
    console.log('🔑 FCM Token:', client.fcmToken);

    // Тестовый заказ
    const testOrder = {
      _id: '507f1f77bcf86cd799439011',
      status: 'on_way',
      sum: 1500,
      address: { city: 'Алматы', street: 'Тестовая 1' },
      products: { water12: 2, water19: 1 },
      date: { date: new Date() },
    };

    // Отправляем уведомление
    const result = await pushNotificationService.sendOrderStatusUpdate(
      client.fcmToken,
      testOrder
    );

    console.log('📤 Результат отправки:', result);

    if (result.success) {
      console.log('✅ Тестовое уведомление отправлено успешно!');
    } else {
      console.log('❌ Ошибка отправки:', result.error);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

testPushNotification();
```

Запуск:
```bash
node test-push.js
```

---

## 7️⃣ Обработка уведомлений в приложении

### Создайте навигационный сервис (если еще нет)

```typescript
// src/services/NavigationService.ts
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
  }
}
```

### Обновите `App.tsx`:

```typescript
import { navigationRef } from './src/services/NavigationService';

function App() {
  // ... существующий код ...
  
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ImagePreloader>
        <AuthWrapper>
          <NavigationContainer ref={navigationRef}>
            {/* ... ваши экраны ... */}
          </NavigationContainer>
        </AuthWrapper>
      </ImagePreloader>
    </SafeAreaProvider>
  );
}
```

### Обновите обработчики в `pushNotifications.ts`:

```typescript
import * as NavigationService from './NavigationService';

// В setupNotificationHandlers()
messaging().onNotificationOpenedApp(remoteMessage => {
  console.log('👆 Клик по уведомлению:', remoteMessage);
  
  if (remoteMessage.data?.type === 'order_status_update') {
    const orderId = remoteMessage.data.orderId;
    
    // Переходим к экрану статуса заказа
    setTimeout(() => {
      NavigationService.navigate('OrderStatus', { orderId });
    }, 500);
  }
});
```

---

## ✅ Итоговый чек-лист:

### Backend:
- [ ] Установлен `firebase-admin`
- [ ] Получен Service Account Key
- [ ] Создан `firebaseAdmin.js`
- [ ] Создан `pushNotificationService.js`
- [ ] Добавлены поля `fcmToken`, `devicePlatform` в схему Client
- [ ] Создан endpoint `/saveFcmToken`
- [ ] Обновлена функция изменения статуса заказа
- [ ] Протестирована отправка через `test-push.js`

### Frontend:
- [ ] Обновлен `API_URL` в `pushNotifications.ts`
- [ ] Обновлена функция `sendTokenToServer`
- [ ] Обновлен `useAuth.ts` для сохранения email
- [ ] Добавлен `NavigationService`
- [ ] Настроена навигация при клике на уведомление
- [ ] Протестировано получение уведомлений

---

## 🎉 Готово!

Теперь при изменении статуса заказа:
1. ✅ Сервер обновляет статус в БД
2. ✅ Сервер отправляет push-уведомление клиенту
3. ✅ Клиент получает уведомление
4. ✅ При клике открывается экран заказа
5. ✅ Данные заказа обновляются в приложении

