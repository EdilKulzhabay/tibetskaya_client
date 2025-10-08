/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';

// Регистрация обработчика фоновых уведомлений
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📬 Фоновое сообщение обработано!', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
