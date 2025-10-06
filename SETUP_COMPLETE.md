# ✅ Настройка Push-уведомлений завершена!

## 📋 Что было сделано:

### 1. ✅ Установлены зависимости
- `@react-native-firebase/app` - основная библиотека Firebase
- `@react-native-firebase/messaging` - для push-уведомлений
- Все CocoaPods зависимости установлены

### 2. ✅ Создан сервис push-уведомлений
Файл: `src/services/pushNotifications.ts`

**Возможности:**
- ✅ Запрос разрешений на уведомления
- ✅ Получение FCM токена
- ✅ Отправка токена на сервер
- ✅ Обработка уведомлений (фоновые и на переднем плане)
- ✅ Обработка кликов по уведомлениям
- ✅ Автоматическое обновление токена

### 3. ✅ Настроен AppDelegate.swift
- Добавлена инициализация Firebase
- Настроены делегаты для push-уведомлений
- Добавлены обработчики APNs токенов

### 4. ✅ Создан entitlements файл
Файл: `ios/tibetskayaClientApp/tibetskayaClientApp.entitlements`
- Настроен для development окружения

### 5. ✅ Обновлен Podfile
- Добавлен `use_frameworks! :linkage => :static` для поддержки Firebase

### 6. ✅ Интегрировано в App.tsx
- Push-уведомления инициализируются при запуске приложения

---

## ⚠️ КРИТИЧЕСКИ ВАЖНО: Следующие шаги

Приложение **НЕ ЗАПУСТИТСЯ** пока вы не выполните эти шаги:

### Шаг 1: Получить GoogleService-Info.plist

1. Перейдите на [Firebase Console](https://console.firebase.google.com/)
2. Создайте проект или выберите существующий
3. Добавьте iOS приложение:
   - Bundle ID должен совпадать с вашим в Xcode
   - Скачайте `GoogleService-Info.plist`
4. Поместите файл:
   ```
   ios/tibetskayaClientApp/GoogleService-Info.plist
   ```

### Шаг 2: Добавить файл в Xcode

```bash
open ios/tibetskayaClientApp.xcworkspace
```

1. Перетащите `GoogleService-Info.plist` в папку `tibetskayaClientApp` в Xcode
2. **Важно!** Убедитесь, что галочка стоит на таргете `tibetskayaClientApp`

### Шаг 3: Настроить Capabilities в Xcode

1. Выберите проект → таргет `tibetskayaClientApp`
2. Вкладка **Signing & Capabilities**
3. Нажмите **+ Capability** и добавьте:
   - **Push Notifications**
   - **Background Modes** → включите **Remote notifications**

### Шаг 4: Настроить APNs в Firebase

#### 4.1 Создать APNs ключ:
1. [Apple Developer](https://developer.apple.com/account) → **Keys**
2. Создайте новый ключ с **APNs** capability
3. Скачайте файл `.p8` (только один раз!)
4. Запомните **Key ID** и **Team ID**

#### 4.2 Загрузить в Firebase:
1. Firebase Console → **Project Settings** → **Cloud Messaging**
2. **iOS app configuration** → **APNs Authentication Key**
3. Загрузите `.p8`, введите Key ID и Team ID

### Шаг 5: Проверить Bundle ID

Bundle ID должен совпадать:
- Xcode (General → Bundle Identifier)
- Firebase Console
- Apple Developer (App ID)
- GoogleService-Info.plist

---

## 🚀 Запуск приложения

После выполнения всех шагов:

```bash
npm run ios
```

**Ожидаемый результат в консоли:**
```
🔔 Инициализация push-уведомлений...
✅ Push notifications authorized
📱 APNs token registered
📱 FCM Token: [ваш уникальный токен]
✅ FCM токен отправлен на сервер
```

---

## 🧪 Тестирование

### Отправка тестового уведомления через Firebase Console:

1. Firebase Console → **Cloud Messaging**
2. **Send your first message**
3. Введите:
   - **Заголовок**: "Тест"
   - **Текст**: "Тестовое уведомление"
4. Выберите приложение
5. **Отправить**

### Важно для тестирования:
- ✅ Push работают на **реальном устройстве**
- ❌ Push **НЕ работают** на симуляторе
- ✅ Приложение должно быть закрыто или в фоне для получения уведомлений

---

## 📱 Использование в коде

### Инициализация с userId (в useAuth хуке):

```typescript
import pushNotificationService from '../services/pushNotifications';

// После успешного логина
pushNotificationService.setUserId(user.id);

// При выходе
pushNotificationService.clearToken();
```

### Получение токена:

```typescript
const token = pushNotificationService.getToken();
console.log('FCM Token:', token);
```

---

## 📚 Документация

- **Подробная инструкция**: `FIREBASE_SETUP_GUIDE.md`
- **Сервис уведомлений**: `src/services/pushNotifications.ts`
- **Следующие шаги**: `NEXT_STEPS_PUSH.md`

---

## 🔧 Troubleshooting

### Приложение крашится при запуске:
```
Reason: [FIRApp configure]; [...] GoogleService-Info.plist
```
**Решение:** Добавьте `GoogleService-Info.plist` в проект (см. Шаг 1-2)

### FCM токен не генерируется:
**Проверьте:**
- GoogleService-Info.plist добавлен правильно
- Bundle ID совпадает везде
- APNs ключ загружен в Firebase
- Есть интернет соединение

### Уведомления не приходят:
**Проверьте:**
- Push Notifications включены в Capabilities
- APNs ключ настроен в Firebase
- Тестируете на реальном устройстве (не симулятор)
- Разрешение на уведомления получено

### Ошибки при pod install:
```bash
export LANG=en_US.UTF-8
cd ios
rm -rf Pods Podfile.lock
pod install
```

---

## ✅ Чек-лист готовности:

- [ ] Firebase проект создан
- [ ] GoogleService-Info.plist получен и добавлен в проект
- [ ] Capabilities (Push Notifications, Background Modes) добавлены в Xcode
- [ ] APNs ключ создан и загружен в Firebase
- [ ] Bundle ID совпадает везде
- [ ] Приложение успешно собирается
- [ ] FCM токен генерируется
- [ ] Тестовое уведомление получено

---

## 🎉 Готово!

После выполнения всех шагов ваше приложение будет готово к приему push-уведомлений!

**Не забудьте:** Для production окружения измените в entitlements:
```xml
<key>aps-environment</key>
<string>production</string>
```

