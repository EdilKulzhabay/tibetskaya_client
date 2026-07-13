# Клиентское приложение (tibetskayaClientApp)

React Native 0.79.6, TypeScript, bare workflow (без Expo).

## Запуск

```bash
npm start               # Metro bundler
npm run android         # Android
npm run ios             # iOS
npm test                # Jest
```

## Структура `src/`

```
api/
  axios.ts              # Axios instance, интерцепторы, JWT из tokenStorage
  services.ts           # Все API-вызовы (apiService.*)
components/             # Переиспользуемые компоненты
  AuthWrapper.tsx       # Редирект на Login если нет токена
  ScreenLayout.tsx      # Обёртка экрана с нижней навигацией
  Navigation.tsx        # Нижняя панель навигации
context/
  TopUpBalanceContext.tsx
hooks/
  useAuth.ts            # AuthProvider + useAuth — токен, данные пользователя
  useApi.ts
navigation/             # (пустой README, маршруты в App.tsx)
screens/                # Экраны (см. ниже)
services/               # (доп. сервисы)
types/
  navigation.ts         # RootStackParamList + все интерфейсы (Order, Courier, Address…)
utils/
  storage.ts            # tokenStorage — AsyncStorage обёртка
```

## Экраны (`src/screens/`)

| Экран | Назначение |
|-------|-----------|
| `HomeScreen` | Главный экран: заказы, баннеры, кошелёк |
| `LoginScreen` / `RegisterScreen` / `OtpScreen` | Авторизация |
| `ForgotPasswordScreen` / `OtpForgotPasswordScreen` / `NewPasswordScreen` | Восстановление пароля |
| `RegisterAcceptedScreen` | Подтверждение регистрации |
| `OrderStatusScreen` | Статус текущего заказа + карта |
| `AddOrderScreen` | Оформление нового заказа |
| `HistoryScreen` | История заказов |
| `ProfileScreen` | Профиль клиента |
| `ChangeDataScreen` | Редактирование данных |
| `WalletScreen` / `WhatIsMyBalanceScreen` / `HowToTopUpScreen` | Кошелёк |
| `BonusScreen` | Бонусы и реферальная программа |
| `ChatScreen` | Чат с поддержкой |
| `SupportScreen` | Обращение в поддержку |
| `FAQScreen` | Часто задаваемые вопросы |
| `TarrifsScreen` | Тарифы |
| `SettingsScreen` | Настройки |
| `Address/*` | Адреса доставки |
| `Hydration/*` | Трекер гидратации |
| `TakePartInviteScreen` | Реферальная программа |
| `DeleteAccountScreen` | Удаление аккаунта |

## Навигация

`App.tsx` — `NativeStackNavigator` с `RootStackParamList`. Экраны оборачиваются в `withLayout()` для добавления нижней навигации. Роутинг: `NavigationContainer` > `AuthWrapper` > `Stack.Navigator`.

## Ключевые библиотеки

- `@react-navigation/native-stack` — навигация
- `@react-native-firebase/app` + `messaging` — пуш (FCM)
- `@notifee/react-native` — отображение уведомлений
- `react-native-maps` — карта (на экране заказа)
- `react-native-image-picker` — выбор фото
- `react-native-pdf` — просмотр PDF
- `axios` — HTTP (инстанс в `api/axios.ts`)
- `AsyncStorage` — локальное хранилище

## API

Base URL: `https://api.tibetskayacrm.kz`  
Auth header: `Authorization: Bearer <token>` (добавляется автоматически из `tokenStorage`)  
При 401 — токены очищаются (`tokenStorage.removeTokens()`).

Ключевые эндпоинты (в `api/services.ts`):
- `POST /getClientDataMobile` — данные клиента
- `POST /sendMail` — отправка кода регистрации
- `POST /codeConfirm` — подтверждение кода
- `POST /clientRegister` — регистрация
- `POST /clientLogin` — вход

## Сборка

```bash
./build_release_apk.sh   # APK
./build_release_aab.sh   # AAB для Google Play
```

## Важно

- Интеграция с Hillstar (см. `Hillstar_Integration_Info.md`, `Hillstar_Widget_Guide.md`)
- `ImagePreloader` предзагружает ресурсы на старте
- Компоненты экспортируются через `src/components/index.ts` и `src/screens/index.ts`
