# Интеграция виджета Hillstarpay — информация для менеджера

**Дата:** 2025  
**Проект:** TibetSkaya CRM (мобильное приложение React Native)  
**Проблема:** При открытии платёжной формы отображается ошибка «Внутренняя ошибка сервиса».

---

## 1. Домен (origin)

Виджет загружается со страницы, размещённой на домене:

```
https://api.tibetskayacrm.kz
```

**Просьба:** добавить этот домен в whitelist для виджета оплаты.

---

## 2. URL страницы с виджетом

Страница отдаётся по адресу:

```
GET https://api.tibetskayacrm.kz/api/payment/widget-page?sessionId={sessionId}
```

Полный URL страницы: `https://api.tibetskayacrm.kz/api/payment/widget-page?sessionId=...`

---

## 3. Скрипт виджета

Используется скрипт из официальной документации:

```
https://cdn.hillstarpay.com/widget-js/pbwidget.js
```

Подключение: динамически через `document.createElement('script')` с `async=1`.

---

## 4. Вызов виджета

После загрузки скрипта вызывается:

```javascript
Widget(data).create();
```

---

## 5. Структура данных, передаваемых в Widget()

```javascript
{
  token: "ВАШ_ТОКЕН_ВИДЖЕТА",  // из HILLSTAR_WIDGET_TOKEN
  payment: {
    order: "topup-{userId}-{timestamp}",  // например: topup-64abc123-1709567890123
    amount: 5000,                         // сумма в тенге
    currency: "KZT",
    description: "Пополнение баланса",
    test: 1,                               // 1 = тестовый режим, 0 = боевой
    options: {
      callbacks: {
        result_url: "https://api.tibetskayacrm.kz/api/payment/callback"
      },
      user: {
        id: "64abc123def456789"            // MongoDB ObjectId клиента
      }
    }
  }
}
```

---

## 6. Callback URL (result_url)

```
https://api.tibetskayacrm.kz/api/payment/callback
```

Ожидается POST-запрос с полями: `pg_result`, `pg_order_id`, `pg_payment_id`, `pg_amount`, `pg_card_token`, `pg_card_id`, `pg_sig`.

---

## 7. Токен виджета

Используется токен виджета (отдельный от merchant_id и secret_key), полученный от менеджера Hillstarpay. Хранится в переменной окружения `HILLSTAR_WIDGET_TOKEN` на сервере.

---

## 8. Технический flow

1. Приложение (React Native) → `POST /api/payment/widget-config` с `{ userId, amount }`
2. Сервер создаёт сессию и возвращает URL: `https://api.tibetskayacrm.kz/api/payment/widget-page?sessionId=xxx`
3. WebView в приложении загружает этот URL (страница отдаётся с origin `api.tibetskayacrm.kz`)
4. Страница загружает `pbwidget.js` с `cdn.hillstarpay.com`
5. Вызывается `Widget(data).create()` с данными из п. 5
6. После этого появляется ошибка «Внутренняя ошибка сервиса»

---

## 9. Вопросы для проверки на стороне Hillstarpay

1. **Домен:** Добавлен ли `api.tibetskayacrm.kz` в whitelist для виджета?
2. **Токен:** Корректен ли выданный токен виджета и не истёк ли он?
3. **Тестовый режим:** Используется `test: 1` — нужны ли особые настройки для тестового режима?
4. **Формат данных:** Соответствует ли структура `payment` и `options` ожидаемому API виджета?

---

## 10. Контакт для обратной связи

Для уточнений по интеграции — [ваши контакты].
