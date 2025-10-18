# 🔔 Настройка Push-уведомлений (Android + iOS)

## ✅ Что настроено

### Android
- ✅ Канал уведомлений `orders_v2` с высоким приоритетом
- ✅ Системный звук по умолчанию
- ✅ Вибрация
- ✅ Запрос разрешения POST_NOTIFICATIONS (Android 13+)
- ✅ Маленькая иконка: `ic_notification.png` (ваша иконка)
- ✅ Большая иконка: `notificationIcon.png` (ваша цветная иконка)
- ✅ Цвет акцента: #EE3F58 (розовый)

### iOS
- ✅ Firebase Messaging настроен
- ✅ APNs токены регистрируются
- ✅ Системный звук по умолчанию
- ✅ Badge (значок на иконке приложения)
- ✅ Изображение во вложении: `notificationIcon.png`
- ✅ Важный уровень прерывания (timeSensitive)
- ✅ Фоновые уведомления (remote-notification)

## 📦 Файлы конфигурации

### Android
```
android/app/src/main/AndroidManifest.xml
android/app/src/main/java/com/tibetskayaclientapp/MainApplication.kt
android/app/src/main/res/drawable/ic_notification.png
android/app/google-services.json
```

### iOS
```
ios/tibetskayaClientApp/AppDelegate.swift
ios/tibetskayaClientApp/Info.plist
ios/tibetskayaClientApp/tibetskayaClientApp.entitlements
ios/GoogleService-Info.plist
```

### Общие
```
src/services/pushNotifications.ts
src/assets/notificationIcon.png
index.js
```

## 🚀 Сборка и тестирование

### Android

#### 1. Сборка APK
```bash
cd android
./gradlew clean
./gradlew assembleRelease
cd ..
```

#### 2. Установка
```bash
# Удалите старое приложение
adb uninstall com.tibetskayaclientapp

# Установите новое
adb install android/app/build/outputs/apk/release/app-release.apk
```

#### 3. Тестирование
1. Запустите приложение
2. **Дайте разрешение** на уведомления (важно!)
3. Отправьте тестовое уведомление с сервера
4. Проверьте:
   - ✅ Звук воспроизводится
   - ✅ Вибрация работает
   - ✅ Ваша иконка отображается
   - ✅ Цвет акцента розовый

### iOS

#### 1. Установка зависимостей
```bash
cd ios
pod install
cd ..
```

#### 2. Сборка
```bash
# Для development
npx react-native run-ios

# Или откройте в Xcode
open ios/tibetskayaClientApp.xcworkspace
```

#### 3. Настройка сертификатов (требуется)
1. Откройте проект в Xcode
2. **Signing & Capabilities**
3. Добавьте **Apple ID** аккаунт
4. Выберите **Team**
5. Убедитесь что capability **Push Notifications** включен
6. Убедитесь что **Background Modes** → **Remote notifications** включен

#### 4. Тестирование
1. Запустите приложение на физическом устройстве (симулятор не поддерживает push)
2. Дайте разрешение на уведомления
3. Отправьте тестовое уведомление
4. Проверьте:
   - ✅ Звук воспроизводится
   - ✅ Badge увеличивается
   - ✅ Изображение отображается

## 🔍 Проверка логов

### Android
```bash
npx react-native log-android

# Или напрямую
adb logcat | grep -E "(FCM|Firebase|Notification|🔴|🟢)"
```

### iOS
```bash
npx react-native log-ios

# Или в Xcode: View → Debug Area → Activate Console
```

## 📱 Ожидаемые логи

### При запуске приложения:
```
✅ Фоновый обработчик уведомлений зарегистрирован
🔔 Инициализация push-уведомлений...
✅ Канал уведомлений notifee создан: orders_v2
📱 Android 13+: Запрашиваем разрешение POST_NOTIFICATIONS
✅ Android: Разрешение POST_NOTIFICATIONS получено
✅ Firebase: Разрешение на уведомления получено
📱 FCM Token: eRMaGZFf...
📤 Отправка FCM токена на сервер...
✅ FCM токен отправлен на сервер успешно
```

### При получении уведомления (фон):
```
🔴🔴🔴 ФОНОВОЕ УВЕДОМЛЕНИЕ ПОЛУЧЕНО! 🔴🔴🔴
📬 Полные данные сообщения: {...}
📋 Notification: {title: "...", body: "..."}
📦 Data: {newStatus: "...", orderId: "..."}
```

### При получении уведомления (передний план):
```
🟢🟢🟢 УВЕДОМЛЕНИЕ НА ПЕРЕДНЕМ ПЛАНЕ! 🟢🟢🟢
📨 Полные данные: {...}
✅ Локальное уведомление показано (Android + iOS)
```

## ⚠️ Решение проблем

### Нет звука на Android

**Причина:** Старый канал уведомлений без звука

**Решение:**
1. Удалите приложение полностью
2. Пересоберите APK
3. Установите заново

**Или вручную:**
```
Настройки → Приложения → tibetskayaClientApp → Уведомления 
→ Уведомления о заказах → Включить звук
```

### Не появляется запрос на разрешение

**Android:**
```bash
adb uninstall com.tibetskayaclientapp
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

**iOS:**
- Удалите приложение с устройства
- Переустановите через Xcode

### Уведомления не приходят на iOS

**Проверьте:**
1. Тестируете на **физическом устройстве** (не симуляторе)
2. Push Notifications capability включен в Xcode
3. APNs сертификаты настроены в Firebase Console
4. Bundle ID совпадает: `com.tibetskayaclientapp`

### FCM токен не отправляется на сервер

**Проверьте логи:**
```
⚠️ userId не установлен, токен НЕ отправлен на сервер
```

**Решение:** Токен отправляется после логина/регистрации через `useAuth` хук

## 🎨 Изменение иконок

### Android

**Маленькая иконка (слева в уведомлении):**
```
android/app/src/main/res/drawable/ic_notification.png
```

**Большая иконка (справа в уведомлении):**
```typescript
// src/services/pushNotifications.ts
largeIcon: require('../assets/your-icon.png')
```

### iOS

**Изображение во вложении:**
```typescript
// src/services/pushNotifications.ts
attachments: [
  {
    url: require('../assets/your-icon.png'),
    thumbnailHidden: false,
  },
]
```

## 🔐 Production настройки

### Android
APK уже готов к production (использует release keystore)

### iOS

1. Измените в `tibetskayaClientApp.entitlements`:
```xml
<key>aps-environment</key>
<string>production</string>
```

2. В Xcode выберите **Archive** для App Store

3. В Firebase Console добавьте **APNs Production Certificate**

## 📞 Поддержка

Если уведомления не работают:
1. Проверьте логи (см. выше)
2. Убедитесь что разрешения даны
3. Проверьте настройки канала уведомлений
4. Протестируйте на другом устройстве

