# Настройка Team ID для создания IPA

## Как найти ваш Team ID

### Способ 1: Через Xcode
1. Откройте проект в Xcode: `ios/tibetskayaClientApp.xcworkspace`
2. Выберите проект в навигаторе
3. Выберите target "tibetskayaClientApp"
4. Перейдите на вкладку "Signing & Capabilities"
5. В разделе "Team" найдите ваш Team ID (формат: `XXXXXXXXXX`)

### Способ 2: Через Apple Developer Portal
1. Войдите в [Apple Developer Portal](https://developer.apple.com/account/)
2. Перейдите в "Certificates, Identifiers & Profiles"
3. В разделе "Identifiers" найдите ваш App ID
4. Team ID будет указан в информации о команде

### Способ 3: Через командную строку
```bash
security find-identity -v -p codesigning
```

## Обновление ExportOptions.plist

После получения Team ID, обновите файл `build/ipa/ExportOptions.plist`:

```xml
<key>teamID</key>
<string>YOUR_ACTUAL_TEAM_ID</string>
```

Замените `YOUR_ACTUAL_TEAM_ID` на ваш реальный Team ID.

## Проверка Bundle ID

Убедитесь, что Bundle ID в проекте соответствует настройкам в App Store Connect:

1. В Xcode: Project → Target → General → Bundle Identifier
2. В App Store Connect: App Information → Bundle ID

## Важные замечания

- Team ID должен быть одинаковым в Xcode и ExportOptions.plist
- Убедитесь, что у вас есть действующий сертификат разработчика
- Проверьте, что App ID зарегистрирован в Apple Developer Portal
- Для TestFlight нужен Distribution Certificate, а не Development Certificate
