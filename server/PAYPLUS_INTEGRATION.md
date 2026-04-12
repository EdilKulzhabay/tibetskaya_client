# Интеграция Pay Plus (Payplus)

**API-домен (актуально):** `https://ventrapay.net`. Если в `.env` указан старый `https://payplus.kz`, замените на `https://ventrapay.net`.

## 1. Переменные окружения

Добавьте в `.env`:

```
PAYPLUS_BASE_URL=https://ventrapay.net
PAYPLUS_MERCHANT=ВАШ_MERCHANT_ID
PAYPLUS_SECRET=ВАШ_SECRET_KEY
API_BASE_URL=https://api.tibetskayacrm.kz
```

**Важно:** `PAYPLUS_MERCHANT` и `PAYPLUS_SECRET` должны быть заданы. Иначе `paymentUrl` будет некорректным, и приложение будет использовать `widget-page`, что может давать 404 на production.

- `PAYPLUS_BASE_URL` — базовый URL API Pay Plus (с 2026: `https://ventrapay.net`)
- `PAYPLUS_MERCHANT` — ID мерчанта из личного кабинета Payplus
- `PAYPLUS_SECRET` — секретный ключ мерчанта
- `API_BASE_URL` — URL вашего API (для callback и виджета)

## 2. Настройка мерчанта в Payplus

В личном кабинете Payplus ([payplus.kz](https://payplus.kz)) укажите:

- **process_url**: `https://api.tibetskayacrm.kz/api/payment/payplus-callback`  
  (куда Payplus отправляет результат платежа)

- **success_url**: `https://api.tibetskayacrm.kz/api/payment/success`  
  (редирект пользователя при успехе)

- **fail_url**: `https://api.tibetskayacrm.kz/api/payment/error`  
  (редирект при ошибке)

## 3. Подключение роутов

В основном Express-приложении:

```js
import paymentRoutes from "./server/routes/paymentRoutes.js";

app.use("/api/payment", paymentRoutes);
```

## 4. API Endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| POST | /api/payment/create | Создание платежа (sum, email?, phone?, clientId?) |
| POST | /api/payment/widget-config | Конфиг для мобильного приложения (userId, amount, email?, phone?) |
| GET | /api/payment/widget-page?sessionId=xxx | HTML-страница для WebView |
| POST/GET | /api/payment/payplus-callback | Callback от Payplus |
| GET | /api/payment/success | Страница успешной оплаты |
| GET | /api/payment/error | Страница ошибки оплаты |

## 5. Мобильное приложение

Приложение вызывает `POST /api/payment/widget-config` с `userId` и `amount`, получает `widgetPageUrl` и открывает его в WebView. После оплаты Payplus перенаправляет на success/error, откуда WebView отправляет сообщение в React Native.

## 6. Модель PaymentSession

Используется для хранения сессий платежей. Убедитесь, что модель зарегистрирована в Mongoose.
