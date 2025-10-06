# ✅ Push-уведомления: что сделано и что нужно сделать

## ✅ Что уже сделано:

1. ✅ Установлены Firebase зависимости (`@react-native-firebase/app`, `@react-native-firebase/messaging`)
2. ✅ Создан сервис push-уведомлений (`src/services/pushNotifications.ts`)
3. ✅ Обновлен `AppDelegate.swift` с инициализацией Firebase
4. ✅ Создан entitlements файл (`tibetskayaClientApp.entitlements`)
5. ✅ Обновлен `Podfile` для поддержки Firebase
6. ✅ Установлены все CocoaPods зависимости

## ❗ Что нужно сделать СЕЙЧАС:

### 1. Получить GoogleService-Info.plist из Firebase Console

**Важно!** Без этого файла push-уведомления НЕ БУДУТ работать!

#### Шаги:

1. Перейдите на [Firebase Console](https://console.firebase.google.com/)
2. Выберите или создайте проект
3. Добавьте iOS приложение:
   - Нажмите **Добавить приложение** → **iOS**
   - **Bundle ID**: Получите из Xcode (обычно что-то вроде `com.tibetskaya.app`)
   - Скачайте `GoogleService-Info.plist`

4. Поместите файл в проект:
   ```
   ios/tibetskayaClientApp/GoogleService-Info.plist
   ```

5. Откройте проект в Xcode:
   ```bash
   open ios/tibetskayaClientApp.xcworkspace
   ```

6. Перетащите `GoogleService-Info.plist` в Xcode в папку `tibetskayaClientApp`
   - **Важно**: Убедитесь, что галочка стоит на таргете `tibetskayaClientApp`

### 2. Настроить Capabilities в Xcode

1. Откройте `ios/tibetskayaClientApp.xcworkspace` в Xcode
2. Выберите проект `tibetskayaClientApp` → таргет `tibetskayaClientApp`
3. Перейдите на вкладку **Signing & Capabilities**
4. Нажмите **+ Capability** и добавьте:
   - ✅ **Push Notifications**
   - ✅ **Background Modes** → включите **Remote notifications**

### 3. Настроить APNs ключ в Firebase

#### 3.1 Создать APNs ключ в Apple Developer:

1. Перейдите на [Apple Developer](https://developer.apple.com/account)
2. **Certificates, Identifiers & Profiles** → **Keys**
3. Создайте новый ключ:
   - Название: "Firebase Push Key"
   - Включите: **Apple Push Notifications service (APNs)**
4. Скачайте файл `.p8` (его можно скачать только ОДИН РАЗ!)
5. Запомните **Key ID** и **Team ID**

#### 3.2 Загрузить ключ в Firebase:

1. Firebase Console → **Project Settings** → **Cloud Messaging**
2. Раздел **iOS app configuration** → **APNs Authentication Key**
3. Загрузите файл `.p8`
4. Введите **Key ID** и **Team ID**

### 4. Проверить Bundle ID

Убедитесь, что Bundle ID совпадает везде:
- ✅ Xcode (таргет → General → Bundle Identifier)
- ✅ Firebase Console (iOS приложение)
- ✅ Apple Developer (App ID)
- ✅ GoogleService-Info.plist (параметр `BUNDLE_ID`)

### 5. Интегрировать сервис в App.tsx

Добавьте в `App.tsx`:

\`\`\`typescript
import pushNotificationService from './src/services/pushNotifications';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Инициализация push-уведомлений
    pushNotificationService.initialize();
  }, []);

  // ... остальной код
}
\`\`\`

### 6. Запустить приложение

```bash
npm run ios
```

В консоли вы должны увидеть:
```
🔔 Инициализация push-уведомлений...
✅ Push notifications authorized
📱 APNs token registered
📱 FCM Token: [ваш токен]
```

## 📚 Дополнительная информация:

- Подробная инструкция: `FIREBASE_SETUP_GUIDE.md`
- Сервис уведомлений: `src/services/pushNotifications.ts`

## 🧪 Тестирование:

После настройки отправьте тестовое уведомление через Firebase Console:
1. **Cloud Messaging** → **Send your first message**
2. Введите текст
3. Выберите приложение
4. Отправьте

## ⚠️ Важные заметки:

1. **Без `GoogleService-Info.plist` приложение будет крашиться!**
2. APNs работают только на реальном устройстве (не на симуляторе)
3. Для production измените в entitlements: `development` → `production`
4. Убедитесь, что Push Notifications включены в App ID на Apple Developer

## 🆘 Проблемы?

Если приложение крашится:
- Проверьте, что `GoogleService-Info.plist` добавлен в проект
- Проверьте Bundle ID
- Проверьте логи в Xcode Console

