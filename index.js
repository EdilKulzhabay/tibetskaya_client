/**
 * @format
 */

import {AppRegistry, Platform} from 'react-native';
// Должно быть первым импортом — отключает системное масштабирование шрифта
// (специальные возможности: крупный текст, полужирный текст и т.п.) для всех
// Text/TextInput в приложении, до рендера любого компонента.
import './src/utils/disableFontScaling';
import App from './App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee from '@notifee/react-native';
import {
  handleCallNotificationBackgroundEvent,
  handleCallPushInBackground,
} from './src/features/calls/callBackground';
import {registerOngoingCallService} from './src/features/calls/incomingCallNotification';

// Кнопки уведомления о входящем звонке, когда приложение в фоне или убито
notifee.onBackgroundEvent(async event => {
  await handleCallNotificationBackgroundEvent(event);
});

if (Platform.OS === 'android') {
  // Foreground-сервис идущего звонка (микрофон в свёрнутом приложении)
  registerOngoingCallService();
}

// Регистрация обработчика фоновых уведомлений
// Это КРИТИЧЕСКИ ВАЖНО - должно быть в index.js, вне React компонента
messaging().setBackgroundMessageHandler(async remoteMessage => {
  // Пуш о входящем звонке: показать уведомление-звонок и больше ничего не делать
  if (await handleCallPushInBackground(remoteMessage)) {
    return;
  }
  const d = remoteMessage.data || {};
  const silentBalance =
    d.newStatus === 'balanceTopUpSuccess' ||
    String(d.newStatus || '').toLowerCase() === 'balancetopupsuccess';
  if (silentBalance) {
    try {
      await AsyncStorage.setItem('pendingUserProfileRefresh', '1');
    } catch (e) {
      console.warn('pendingUserProfileRefresh:', e?.message);
    }
    return Promise.resolve();
  }

  console.log('🔴🔴🔴 ФОНОВОЕ УВЕДОМЛЕНИЕ ПОЛУЧЕНО! 🔴🔴🔴');
  console.log(
    '📬 Полные данные сообщения:',
    JSON.stringify(remoteMessage, null, 2),
  );
  console.log('📋 Notification:', remoteMessage.notification);
  console.log('📦 Data:', remoteMessage.data);
  console.log('🆔 Message ID:', remoteMessage.messageId);

  // Обработка данных заказа
  if (remoteMessage.data) {
    const {newStatus, order, orderId, orderStatus} = remoteMessage.data;
    console.log('✅ Статус (newStatus):', newStatus);
    console.log('✅ Статус заказа (orderStatus):', orderStatus);
    console.log('✅ ID заказа:', orderId);
    if (order) {
      console.log('✅ Данные заказа получены (длина):', order.length);
      try {
        const orderData = typeof order === 'string' ? JSON.parse(order) : order;
        console.log('✅ Статус из данных заказа:', orderData.status);
      } catch (error) {
        console.error(
          '❌ Ошибка парсинга заказа в фоновом обработчике:',
          error,
        );
      }
    }
  }

  return Promise.resolve();
});

console.log('✅ Фоновый обработчик уведомлений зарегистрирован');

AppRegistry.registerComponent(appName, () => App);
