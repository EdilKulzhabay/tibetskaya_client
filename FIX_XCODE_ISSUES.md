# Исправление проблем в Xcode

## ✅ Что уже исправлено:
- Bundle Identifier изменен на `com.tibetskaya.clientapp`

## 🔧 Что нужно сделать в Xcode:

### 1. Обновите проект в Xcode
1. В Xcode нажмите **Cmd+Shift+K** (Clean Build Folder)
2. Закройте Xcode
3. Откройте проект заново: `open ios/tibetskayaClientApp.xcworkspace`

### 2. Исправьте Bundle Identifier
1. Выберите проект `tibetskayaClientApp` в навигаторе
2. Выберите target `tibetskayaClientApp`
3. На вкладке "General" найдите "Bundle Identifier"
4. Убедитесь, что указано: `com.tibetskaya.clientapp`

### 3. Настройте подписание кода
1. Перейдите на вкладку "Signing & Capabilities"
2. Убедитесь, что:
   - ✅ "Automatically manage signing" включено
   - Team: "VERTO BUSINESS (VERTO BIZNES), TOO"
   - Bundle Identifier: `com.tibetskaya.clientapp`

### 4. Решите проблему с устройствами
**Вариант A: Подключите физическое устройство**
1. Подключите iPhone/iPad к Mac через USB
2. Доверьте компьютеру на устройстве
3. В Xcode выберите ваше устройство в списке устройств

**Вариант B: Добавьте устройство вручную**
1. Перейдите в [Apple Developer Portal](https://developer.apple.com/account/)
2. Certificates, Identifiers & Profiles → Devices
3. Нажмите "+" и добавьте ваше устройство
4. В Xcode нажмите "Try Again" в разделе подписания

### 5. Создайте App ID в Apple Developer Portal
1. Перейдите в [Apple Developer Portal](https://developer.apple.com/account/)
2. Certificates, Identifiers & Profiles → Identifiers
3. Нажмите "+" → App IDs
4. Создайте новый App ID:
   - Description: `Tibetskaya Client App`
   - Bundle ID: `com.tibetskaya.clientapp`
   - Capabilities: выберите нужные (например, Maps)

### 6. Создайте архив
После исправления всех проблем:
1. Выберите "Any iOS Device (arm64)" в верхней панели
2. Product → Archive
3. Дождитесь завершения сборки

## 🚨 Важные замечания:
- Bundle ID должен быть уникальным в App Store
- Убедитесь, что у вас есть действующий Apple Developer аккаунт
- Для TestFlight нужен Distribution Certificate

## 📱 Если нет физического устройства:
Можно создать архив без подключения устройства, но нужно:
1. Добавить хотя бы одно устройство в Apple Developer Portal
2. Создать правильный App ID
3. Настроить Provisioning Profile
