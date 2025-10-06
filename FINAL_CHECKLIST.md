# ✅ Финальный чек-лист настройки Push-уведомлений

## 📱 ПРИЛОЖЕНИЕ (React Native) - ГОТОВО ✅

### Что сделано:
- ✅ Firebase SDK установлен
- ✅ `pushNotifications.ts` создан и настроен
- ✅ `AppDelegate.swift` обновлен
- ✅ Обработчики уведомлений настроены
- ✅ Обновление статусов заказов реализовано
- ✅ API URL настроен на `https://api.tibetskayacrm.kz`
- ✅ Endpoint для токена: `/saveFcmToken`

### Осталось сделать в приложении:
1. **Обновить `src/hooks/useAuth.ts`:**

```typescript
// В функции saveUserData ДОБАВЬТЕ:
await AsyncStorage.setItem('userMail', clientData.mail);
pushNotificationService.setUserId(clientData._id);

// В функции logout ДОБАВЬТЕ:
await pushNotificationService.clearToken();
await AsyncStorage.removeItem('userMail');
```

---

## 🖥️ СЕРВЕР (Node.js) - НУЖНО НАСТРОИТЬ

### Шаг 1: Установка пакета
```bash
npm install firebase-admin
```

### Шаг 2: Service Account Key
1. [Firebase Console](https://console.firebase.google.com/) → Ваш проект
2. ⚙️ Project Settings → Service Accounts
3. Generate new private key
4. Сохраните как `firebase-service-account.json`
5. Добавьте в `.gitignore`

### Шаг 3: Обновите схему Client
```javascript
const ClientSchema = new mongoose.Schema({
  // ... существующие поля
  fcmToken: { type: String, default: null },
  devicePlatform: { type: String, enum: ['ios', 'android', null], default: null },
  fcmTokenUpdatedAt: { type: Date, default: null },
});
```

### Шаг 4: Endpoint для сохранения токена
```javascript
router.post('/saveFcmToken', async (req, res) => {
  const { mail, fcmToken, platform } = req.body;
  
  const client = await Client.findOneAndUpdate(
    { mail },
    { fcmToken, devicePlatform: platform || 'ios', fcmTokenUpdatedAt: new Date() },
    { new: true }
  );
  
  res.json({ success: true });
});
```

### Шаг 5: ВАЖНОЕ ИЗМЕНЕНИЕ в вашем коде

**ПРОБЛЕМА:** Данные заказа отправляются только для `newOrder`

**РЕШЕНИЕ:** Измените эту строку:

```javascript
// БЫЛО:
data: {
    newStatus: newStatus.toString(),
    ...(newStatus === "newOrder" && order ? { order: JSON.stringify(order) } : {})
}

// ДОЛЖНО БЫТЬ:
data: {
    newStatus: newStatus.toString(),
    order: order ? JSON.stringify(order) : undefined,
    orderId: order?._id || order?.orderId || 'unknown',
    orderStatus: order?.status || newStatus,
}
```

### Шаг 6: При обновлении статуса заказа

```javascript
async function updateOrderStatus(orderId, newStatus) {
  const order = await Order.findByIdAndUpdate(
    orderId,
    { status: newStatus, updatedAt: new Date() },
    { new: true }
  );

  const client = await Client.findById(order.client);
  
  if (client?.fcmToken) {
    const statusMessages = {
      'pending': { title: '📦 Заказ принят', body: 'Ваш заказ принят в обработку' },
      'accepted': { title: '✅ Заказ подтвержден', body: 'Заказ подтвержден' },
      'on_way': { title: '🚗 Заказ в пути', body: 'Курьер везет ваш заказ' },
      'delivered': { title: '🎉 Заказ доставлен', body: 'Заказ доставлен!' },
      'cancelled': { title: '❌ Заказ отменен', body: 'Заказ отменен' },
    };

    const message = statusMessages[newStatus] || { 
      title: '📬 Обновление', 
      body: 'Статус заказа изменен' 
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

  return order;
}
```

---

## 🧪 ТЕСТИРОВАНИЕ

### 1. Проверьте сохранение токена

После логина в приложении:
```javascript
// В MongoDB
db.clients.findOne({ mail: "test@example.com" }, { fcmToken: 1, devicePlatform: 1 })
```

Должны увидеть FCM токен.

### 2. Тестовая отправка

Создайте `test-push.js`:
```javascript
// Код из SERVER_CODE_ANALYSIS.md раздел "Тестирование"
```

Запустите:
```bash
node test-push.js
```

### 3. Проверьте логи

**В приложении (Xcode Console):**
```
🔔 Инициализация push-уведомлений...
✅ Push notifications authorized
📱 FCM Token: eXaMpLe...
📤 Отправка FCM токена на сервер для: user@example.com
✅ FCM токен отправлен на сервер
```

**На сервере:**
```
📱 Сохранение FCM токена для: user@example.com
✅ FCM токен сохранен
📝 Обновление статуса заказа -> on_way
📤 Отправка на 1 устройств
✅ Успешно отправлено
```

**В приложении при получении:**
```
📨 Уведомление на переднем плане
🔔 Обработка данных уведомления
📝 Обновление статуса заказа: on_way
✅ Статус заказа 123 обновлен на: on_way
```

---

## 📊 ПОТОК РАБОТЫ

```
1. Клиент логинится
   ↓
2. Приложение получает FCM токен
   ↓
3. Отправка на /saveFcmToken
   ↓
4. Токен сохраняется в БД
   ↓
5. Менеджер меняет статус заказа
   ↓
6. Сервер обновляет БД
   ↓
7. Сервер вызывает pushNotificationClient()
   ↓
8. Firebase отправляет уведомление
   ↓
9. Приложение получает уведомление
   ↓
10. handleNotificationData() обрабатывает данные
   ↓
11. Статус заказа обновляется локально
   ↓
12. UI обновляется автоматически
```

---

## ⚠️ ВАЖНЫЕ МОМЕНТЫ

### 1. Всегда отправляйте данные заказа
```javascript
// ❌ НЕПРАВИЛЬНО:
...(newStatus === "newOrder" && order ? { order: JSON.stringify(order) } : {})

// ✅ ПРАВИЛЬНО:
order: order ? JSON.stringify(order) : undefined
```

### 2. Структура объекта order
Убедитесь что присутствуют:
- `_id` или `orderId`
- `status`
- `client`
- `sum`
- `address`
- `products`

### 3. Обработка невалидных токенов
```javascript
if (tokenError.code === 'messaging/invalid-registration-token' ||
    tokenError.code === 'messaging/registration-token-not-registered') {
    // Удалите токен из БД
    await Client.findOneAndUpdate(
        { fcmToken: token },
        { fcmToken: null }
    );
}
```

---

## 📚 ДОКУМЕНТАЦИЯ

- **SERVER_CODE_ANALYSIS.md** - Анализ вашего кода и рекомендации
- **BACKEND_PUSH_IMPLEMENTATION.md** - Полное руководство по backend
- **BACKEND_INTEGRATION_EXAMPLE.md** - Примеры для вашего API
- **QUICK_PUSH_SETUP.md** - Быстрая настройка
- **SETUP_COMPLETE.md** - Детальная инструкция

---

## ✅ ИТОГОВЫЙ ЧЕК-ЛИСТ

### Приложение:
- [x] Firebase SDK установлен
- [x] pushNotifications.ts настроен
- [x] AppDelegate.swift обновлен
- [x] Обработчики уведомлений работают
- [ ] useAuth.ts обновлен (saveUserData, logout)

### Сервер:
- [ ] firebase-admin установлен
- [ ] Service Account Key скачан
- [ ] firebaseAdmin.js создан
- [ ] pushNotificationService.js создан (ваш код)
- [ ] Схема Client обновлена (fcmToken)
- [ ] Endpoint /saveFcmToken добавлен
- [ ] Данные order всегда отправляются
- [ ] updateOrderStatus отправляет push
- [ ] Тест test-push.js работает

---

## 🎉 ГОТОВО!

Как только выполните изменения на сервере:
1. Данные заказа будут отправляться всегда
2. Приложение будет получать и обрабатывать уведомления
3. Статусы заказов будут обновляться автоматически

**Если есть вопросы - обращайтесь!** 😊

