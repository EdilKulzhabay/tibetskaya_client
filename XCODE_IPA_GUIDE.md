# Создание IPA через Xcode (Рекомендуемый способ)

## Проблема с командной строкой
Командная строка xcodebuild не работает из-за проблем с React Native Codegen. Используйте Xcode для создания архива.

## Пошаговая инструкция

### 1. Откройте проект в Xcode
```bash
open ios/tibetskayaClientApp.xcworkspace
```

### 2. Настройте подпись кода
1. Выберите проект `tibetskayaClientApp` в навигаторе
2. Выберите target `tibetskayaClientApp`
3. Перейдите на вкладку "Signing & Capabilities"
4. Убедитесь, что:
   - ✅ "Automatically manage signing" включено
   - Выбран правильный Team
   - Bundle Identifier уникален

### 3. Выберите устройство
1. В верхней панели Xcode выберите "Any iOS Device (arm64)"
2. НЕ выбирайте симулятор!

### 4. Создайте архив
1. В меню Xcode: **Product → Archive**
2. Дождитесь завершения сборки (может занять несколько минут)
3. Откроется окно "Organizer"

### 5. Экспортируйте IPA
1. В окне Organizer выберите ваш архив
2. Нажмите **"Distribute App"**
3. Выберите **"App Store Connect"**
4. Нажмите **"Next"**
5. Выберите **"Upload"**
6. Нажмите **"Next"**
7. Проверьте настройки и нажмите **"Upload"**

### 6. Альтернативный способ - экспорт для TestFlight
1. В окне Organizer выберите ваш архив
2. Нажмите **"Distribute App"**
3. Выберите **"App Store Connect"**
4. Нажмите **"Next"**
5. Выберите **"Export"** (вместо Upload)
6. Выберите **"Export for App Store"**
7. Нажмите **"Next"**
8. Выберите команду разработчика
9. Нажмите **"Export"**
10. Выберите папку для сохранения IPA файла

## Результат
- При выборе "Upload" - приложение автоматически загрузится в App Store Connect
- При выборе "Export" - получите IPA файл для ручной загрузки

## Важные замечания
- Убедитесь, что у вас есть действующий Apple Developer аккаунт
- Проверьте, что Bundle ID зарегистрирован в App Store Connect
- Для TestFlight нужен Distribution Certificate

## Если возникают ошибки
1. Очистите проект: **Product → Clean Build Folder**
2. Перезапустите Xcode
3. Проверьте настройки подписи кода
4. Убедитесь, что все зависимости установлены: `cd ios && pod install`
