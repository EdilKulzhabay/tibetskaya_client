# 🔥 Настройка Firebase для iOS Push-уведомлений

## Шаг 1: Создание проекта в Firebase Console

1. Перейдите на [Firebase Console](https://console.firebase.google.com/)
2. Создайте новый проект или выберите существующий
3. Добавьте iOS приложение в проект

## Шаг 2: Настройка iOS приложения в Firebase

1. **Bundle ID**: Используйте ваш Bundle ID из Xcode (например: `com.tibetskaya.app`)
2. **App Nickname**: `tibetskayaClientApp` (опционально)
3. Скачайте файл `GoogleService-Info.plist`
4. Поместите `GoogleService-Info.plist` в папку:
   ```
   ios/tibetskayaClientApp/GoogleService-Info.plist
   ```

## Шаг 3: Настройка Apple Push Notifications (APNs)

### 3.1 Создание APNs ключа в Apple Developer

1. Перейдите на [Apple Developer](https://developer.apple.com/account)
2. **Certificates, Identifiers & Profiles** → **Keys**
3. Нажмите **+** для создания нового ключа
4. Назовите ключ (например: "Firebase Push Key")
5. Включите **Apple Push Notifications service (APNs)**
6. Скачайте ключ (файл `.p8`) - **ВАЖНО: его можно скачать только один раз!**
7. Запомните **Key ID** и **Team ID**

### 3.2 Загрузка APNs ключа в Firebase

1. В Firebase Console перейдите: **Project Settings** → **Cloud Messaging**
2. В разделе **iOS app configuration** найдите **APNs Authentication Key**
3. Нажмите **Upload**
4. Загрузите файл `.p8`
5. Введите **Key ID** и **Team ID**
6. Сохраните

## Шаг 4: Настройка App ID в Apple Developer

1. Перейдите на [Apple Developer](https://developer.apple.com/account)
2. **Certificates, Identifiers & Profiles** → **Identifiers**
3. Выберите ваш App ID или создайте новый
4. В списке **Capabilities** включите:
   - ✅ **Push Notifications**
   - ✅ **Background Modes** (если нужны фоновые уведомления)
5. Сохраните изменения

## Шаг 5: Настройка в Xcode

1. Откройте проект в Xcode:
   ```bash
   open ios/tibetskayaClientApp.xcworkspace
   ```

2. Выберите таргет **tibetskayaClientApp**

3. Перейдите на вкладку **Signing & Capabilities**

4. Добавьте capability **Push Notifications**:
   - Нажмите **+ Capability**
   - Выберите **Push Notifications**

5. Добавьте capability **Background Modes**:
   - Нажмите **+ Capability**
   - Выберите **Background Modes**
   - Включите:
     - ✅ **Remote notifications**
     - ✅ **Background fetch** (опционально)

6. Убедитесь, что файл `GoogleService-Info.plist` добавлен в проект:
   - Перетащите файл в Xcode
   - Убедитесь, что он находится в таргете **tibetskayaClientApp**

## Шаг 6: Проверка Bundle ID

Убедитесь, что Bundle ID в Xcode совпадает с тем, что указан в:
- Firebase Console
- Apple Developer (App ID)
- `GoogleService-Info.plist` (параметр `BUNDLE_ID`)

## Шаг 7: Тестирование

После настройки запустите приложение:

```bash
npm run ios
```

В логах консоли вы должны увидеть:
```
🔔 Инициализация push-уведомлений...
✅ Разрешение на уведомления получено
📱 FCM Token: [ваш токен]
✅ FCM токен отправлен на сервер
```

## Отправка тестового уведомления

### Через Firebase Console:

1. **Cloud Messaging** → **Send your first message**
2. Введите текст уведомления
3. Выберите приложение
4. Отправьте

### Через API:

```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "DEVICE_FCM_TOKEN",
    "notification": {
      "title": "Тест",
      "body": "Тестовое уведомление"
    }
  }'
```

## Troubleshooting

### Не приходят уведомления:
- Проверьте, что APNs ключ загружен в Firebase
- Проверьте Bundle ID
- Убедитесь, что Push Notifications включены в Capabilities
- Проверьте, что разрешение на уведомления получено
- Проверьте логи в Xcode консоли

### Ошибки при сборке:
- Выполните `cd ios && pod install`
- Очистите сборку: `cd ios && rm -rf Pods Podfile.lock && pod install`
- Перезапустите Metro bundler

### FCM токен не генерируется:
- Убедитесь, что `GoogleService-Info.plist` правильно добавлен
- Проверьте, что Firebase инициализирован в AppDelegate.swift
- Проверьте Internet соединение

