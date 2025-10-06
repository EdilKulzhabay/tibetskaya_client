# 🔧 Исправление краша Firebase

## 🔴 Проблема:
Приложение крашится с ошибкой `SIGABRT` на строке `FirebaseApp.configure()` потому что файл `GoogleService-Info.plist` не добавлен в Xcode проект.

## ✅ Решение:

### Вариант 1: Через Xcode (РЕКОМЕНДУЕТСЯ)

1. **Откройте workspace в Xcode:**
   ```bash
   open ios/tibetskayaClientApp.xcworkspace
   ```

2. **Добавьте файл в проект:**
   - Найдите файл `ios/tibetskayaClientApp/GoogleService-Info.plist` в Finder
   - Перетащите его в Xcode в папку `tibetskayaClientApp` (левая панель)
   
3. **ВАЖНО! При добавлении файла:**
   - ✅ Поставьте галочку **"Copy items if needed"**
   - ✅ Убедитесь, что галочка стоит на таргете **tibetskayaClientApp**
   - ✅ Нажмите **Finish**

4. **Проверьте:**
   - В Xcode выберите файл `GoogleService-Info.plist`
   - Справа в панели **Target Membership** должна быть галочка на `tibetskayaClientApp`

5. **Пересоберите проект:**
   ```bash
   npm run ios
   ```

---

### Вариант 2: Если файл уже в проекте, но краш продолжается

Возможно, Firebase не может найти файл. Проверьте:

1. **Откройте Xcode:**
   ```bash
   open ios/tibetskayaClientApp.xcworkspace
   ```

2. **Найдите `GoogleService-Info.plist` в Xcode:**
   - Если файл красный - он не найден, нужно переподключить
   - Удалите reference и добавьте файл заново (перетащите из Finder)

3. **Убедитесь в Bundle ID:**
   - Xcode → Проект → General → Bundle Identifier: `com.tibetskayaclientapp`
   - Должен совпадать с BUNDLE_ID в GoogleService-Info.plist

---

### Вариант 3: Временно отключить Firebase (для тестирования)

Если вам срочно нужно запустить приложение без push-уведомлений:

Закомментируйте инициализацию Firebase в `AppDelegate.swift`:

```swift
func application(
  _ application: UIApplication,
  didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
) -> Bool {
  // ВРЕМЕННО ОТКЛЮЧЕНО для тестирования
  // FirebaseApp.configure()
  // UNUserNotificationCenter.current().delegate = self
  // Messaging.messaging().delegate = self
  // application.registerForRemoteNotifications()
  
  let delegate = ReactNativeDelegate()
  // ... остальной код
}
```

И в `App.tsx`:

```typescript
useEffect(() => {
  // ВРЕМЕННО ОТКЛЮЧЕНО
  // pushNotificationService.initialize();
}, []);
```

---

## 🎯 Чек-лист диагностики:

- [ ] Файл `GoogleService-Info.plist` существует в `ios/tibetskayaClientApp/`
- [ ] Файл добавлен в Xcode проект (не красный)
- [ ] Галочка стоит на таргете `tibetskayaClientApp`
- [ ] Bundle ID совпадает: `com.tibetskayaclientapp`
- [ ] Файл виден в Build Phases → Copy Bundle Resources
- [ ] После изменений выполнен Clean Build (Cmd+Shift+K)

---

## 📱 После исправления:

Запустите приложение:
```bash
npm run ios
```

Вы должны увидеть в консоли:
```
✅ Push notifications authorized
📱 APNs token registered
📱 FCM Token: [ваш токен]
```

Вместо краша! 🎉

