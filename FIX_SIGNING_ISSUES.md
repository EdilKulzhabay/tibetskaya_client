# Исправление ошибок подписания кода

## Проблемы:
1. "Communication with Apple failed" - нет устройств в команде
2. "No profiles for 'com.tibetskayaclientapp' were found" - нет профилей для App Store

## Решение:

### 1. Добавьте устройство в Apple Developer Portal
1. Перейдите в [Apple Developer Portal](https://developer.apple.com/account/)
2. Certificates, Identifiers & Profiles → Devices
3. Нажмите "+" → Register a New Device
4. Добавьте любое устройство (можно использовать UDID симулятора)

### 2. Создайте App ID
1. Certificates, Identifiers & Profiles → Identifiers
2. Нажмите "+" → App IDs
3. Создайте App ID:
   - Description: `Tibetskaya Client App`
   - Bundle ID: `com.tibetskayaclientapp`
   - Capabilities: выберите нужные

### 3. Создайте Provisioning Profile
1. Certificates, Identifiers & Profiles → Profiles
2. Нажмите "+" → iOS App Development
3. Выберите созданный App ID
4. Выберите сертификат
5. Выберите устройство
6. Скачайте и установите профиль

### 4. Альтернативное решение - отключить автоматическое управление
1. В Xcode снимите галочку "Automatically manage signing"
2. Вручную выберите:
   - Team: "VERTO BUSINESS (VERTO BIZNES), TOO"
   - Provisioning Profile: "Tibetskaya Client App" (из Apple Developer Portal)
   - Signing Certificate: "Apple Distribution"

### 5. Для TestFlight используйте App Store профиль
- Создайте Provisioning Profile типа "App Store" (не "iOS App Development")
- Это позволит создать архив для TestFlight

## После исправления:
1. Product → Clean Build Folder (Cmd+Shift+K)
2. Product → Archive
3. Экспортируйте IPA для TestFlight
