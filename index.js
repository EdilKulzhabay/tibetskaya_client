/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';

// Регистрация обработчика фоновых уведомлений
// Это КРИТИЧЕСКИ ВАЖНО - должно быть в index.js, вне React компонента
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('🔴🔴🔴 ФОНОВОЕ УВЕДОМЛЕНИЕ ПОЛУЧЕНО! 🔴🔴🔴');
  console.log('📬 Полные данные сообщения:', JSON.stringify(remoteMessage, null, 2));
  console.log('📋 Notification:', remoteMessage.notification);
  console.log('📦 Data:', remoteMessage.data);
  console.log('🆔 Message ID:', remoteMessage.messageId);
  
  // Обработка данных заказа
  if (remoteMessage.data) {
    const { newStatus, order, orderId } = remoteMessage.data;
    console.log('✅ Статус:', newStatus);
    console.log('✅ ID заказа:', orderId);
    if (order) {
      console.log('✅ Данные заказа получены (длина):', order.length);
    }
  }
  
  return Promise.resolve();
});

console.log('✅ Фоновый обработчик уведомлений зарегистрирован');

AppRegistry.registerComponent(appName, () => App);
