import messaging from '@react-native-firebase/messaging';
import { Platform, DeviceEventEmitter, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import notifee, { AndroidImportance } from '@notifee/react-native';

const API_URL = 'https://api.tibetskayacrm.kz';

class PushNotificationService {
  private fcmToken: string | null = null;
  private isInitialized: boolean = false;

  // Инициализация сервиса
  async initialize() {
    console.log('🔔 Инициализация push-уведомлений...');

    // Создаем канал уведомлений для notifee
    await this.createNotificationChannel();

    // Запрос разрешения
    const authStatus = await this.requestPermission();
    
    if (authStatus) {
      // Получение FCM токена
      await this.getFCMToken();
      
      // Настройка обработчиков (только один раз)
      if (!this.isInitialized) {
        console.log('⚙️ Настройка обработчиков уведомлений (первый раз)');
        this.setupNotificationHandlers();
        this.isInitialized = true;
      } else {
        console.log('ℹ️ Обработчики уведомлений уже настроены, пропускаем');
      }
    }
  }

  // Создание канала уведомлений для notifee
  async createNotificationChannel() {
    try {
      const channelId = await notifee.createChannel({
        id: 'orders_v2', // Новый ID канала - создаст новый канал со звуком
        name: 'Уведомления о заказах',
        importance: AndroidImportance.HIGH,
        sound: 'default', // Системный звук по умолчанию
        vibration: true,
        badge: true,
        lights: true,
        lightColor: '#EE3F58',
      });
      console.log('✅ Канал уведомлений notifee создан:', channelId);
    } catch (error) {
      console.error('❌ Ошибка создания канала notifee:', error);
    }
  }

  // Запрос разрешения на уведомления
  async requestPermission(): Promise<boolean> {
    try {
      // Для Android 13+ (API 33+) нужно явно запросить разрешение
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        console.log('📱 Android 13+: Запрашиваем разрешение POST_NOTIFICATIONS');
        
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Разрешение на уведомления',
            message: 'Приложению нужно разрешение для отправки уведомлений о заказах',
            buttonNeutral: 'Спросить позже',
            buttonNegative: 'Отклонить',
            buttonPositive: 'Разрешить',
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('✅ Android: Разрешение POST_NOTIFICATIONS получено');
        } else {
          console.log('❌ Android: Разрешение POST_NOTIFICATIONS отклонено');
          return false;
        }
      }

      // Запрос разрешения через Firebase (для iOS и дополнительная проверка для Android)
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ Firebase: Разрешение на уведомления получено');
        return true;
      } else {
        console.log('❌ Firebase: Разрешение на уведомления отклонено');
        return false;
      }
    } catch (error) {
      console.error('❌ Ошибка при запросе разрешения:', error);
      return false;
    }
  }

  // Получение FCM токена
  async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      console.log('📱 FCM Token:', token);
      this.fcmToken = token;
      
      // Сохраняем токен локально
      await AsyncStorage.setItem('fcmToken', token);
      
      // Проверяем userMail и отправляем токен на сервер
      const userMail = await AsyncStorage.getItem('userMail');
      if (userMail) {
        console.log('📤 userMail найден в AsyncStorage, отправляем токен на сервер');
        await this.sendTokenToServer(token);
      } else {
        console.log('⚠️ userMail не найден в AsyncStorage, токен НЕ отправлен на сервер');
      }
      
      return token;
    } catch (error) {
      console.error('❌ Ошибка при получении FCM токена:', error);
      return null;
    }
  }

  // Отправка токена на сервер
  async sendTokenToServer(token: string): Promise<void> {
    try {
      // Получаем email пользователя из AsyncStorage
      const userMail = await AsyncStorage.getItem('userMail');
      console.log('📧 Проверка userMail в AsyncStorage:', userMail ? userMail : 'не найден');
      
      if (!userMail) {
        console.log('⚠️ Email пользователя не найден в AsyncStorage, токен не отправлен');
        return;
      }

      console.log('📤 Отправка FCM токена на сервер...');
      console.log('   URL:', `${API_URL}/saveFcmToken`);
      console.log('   Email:', userMail);
      console.log('   Platform:', Platform.OS);
      console.log('   Token (первые 20 символов):', token.substring(0, 20) + '...');
      
      const response = await axios.post(
        `${API_URL}/saveFcmToken`,
        {
          mail: userMail,
          fcmToken: token,
          platform: Platform.OS,
        }
      );
      
      console.log('✅ FCM токен отправлен на сервер успешно');
      console.log('   Ответ сервера:', response.data);
    } catch (error: any) {
      console.error('❌ Ошибка при отправке токена на сервер:');
      if (error.response) {
        console.error('   Статус:', error.response.status);
        console.error('   Данные:', error.response.data);
      } else if (error.request) {
        console.error('   Запрос был отправлен, но ответ не получен');
      } else {
        console.error('   Ошибка:', error.message);
      }
    }
  }

  // Показать локальное уведомление
  async displayLocalNotification(title: string, body: string, data?: any) {
    try {
      await notifee.displayNotification({
        title,
        body,
        data,
        android: {
          channelId: 'orders_v2', // Используем новый канал со звуком
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
          sound: 'default', // Системный звук
          vibrationPattern: [300, 500],
          smallIcon: 'ic_notification', // Белая иконка колокольчика (маленькая, слева)
          largeIcon: require('../assets/notificationIcon.png'), // Ваш цветной логотип (большая, справа)
          color: '#EE3F58', // Цвет акцента (розовый)
          showTimestamp: true,
          autoCancel: true,
        },
        ios: {
          sound: 'default', // Системный звук для iOS
          badgeCount: 1, // Увеличиваем badge на 1
          critical: false, // Обычный приоритет
          interruptionLevel: 'timeSensitive', // Важное уведомление (iOS 15+)
          attachments: [
            {
              url: require('../assets/notificationIcon.png'), // Ваша иконка как вложение
              thumbnailHidden: false,
            },
          ],
        },
      });
      console.log('✅ Локальное уведомление показано (Android + iOS)');
    } catch (error) {
      console.error('❌ Ошибка показа локального уведомления:', error);
    }
  }

  // Обработка данных уведомления
  private async handleNotificationData(remoteMessage: any) {
    console.log('🔔 Обработка данных уведомления:', remoteMessage.data);
    
    if (!remoteMessage.data) {
      return;
    }

    const { newStatus, order } = remoteMessage.data;
    
    // Если это новый заказ
    if (newStatus === 'newOrder' && order) {
      console.log('📦 Получен новый заказ:', order);
      try {
        const orderData = typeof order === 'string' ? JSON.parse(order) : order;
        // Сохраняем информацию о новом заказе
        await AsyncStorage.setItem(`order_${orderData._id || orderData.orderId}`, JSON.stringify(orderData));
        console.log('✅ Данные нового заказа сохранены');
      } catch (error) {
        console.error('❌ Ошибка парсинга данных заказа:', error);
      }
    }
    
    // Если это обновление статуса существующего заказа
    if (newStatus && newStatus !== 'newOrder') {
      console.log('📝 Обновление статуса заказа:', newStatus);
      try {
        if (order) {
          const orderData = typeof order === 'string' ? JSON.parse(order) : order;
          const orderId = orderData._id || orderData.orderId;
          
          if (orderId) {
            // Обновляем статус заказа в локальном хранилище
            const existingOrder = await AsyncStorage.getItem(`order_${orderId}`);
            if (existingOrder) {
              const parsedOrder = JSON.parse(existingOrder);
              parsedOrder.status = newStatus;
              parsedOrder.updatedAt = new Date().toISOString();
              await AsyncStorage.setItem(`order_${orderId}`, JSON.stringify(parsedOrder));
              console.log(`✅ Статус заказа ${orderId} обновлен на: ${newStatus}`);
              
              // Уведомляем компоненты приложения об обновлении
              DeviceEventEmitter.emit('orderStatusUpdated', { 
                orderId, 
                newStatus, 
                orderData: parsedOrder 
              });
            } else {
              // Если заказа нет в локальном хранилище, сохраняем новые данные
              console.log(`ℹ️ Заказ ${orderId} не найден локально, сохраняем новые данные`);
              orderData.status = newStatus;
              orderData.updatedAt = new Date().toISOString();
              await AsyncStorage.setItem(`order_${orderId}`, JSON.stringify(orderData));
              
              // Уведомляем о новом заказе
              DeviceEventEmitter.emit('orderStatusUpdated', { 
                orderId, 
                newStatus, 
                orderData 
              });
            }
          }
        }
      } catch (error) {
        console.error('❌ Ошибка обновления статуса заказа:', error);
      }
    }
  }

  // Настройка обработчиков уведомлений
  setupNotificationHandlers() {
    console.log('⚙️ Настройка обработчиков уведомлений...');
    
    // ВАЖНО: Фоновый обработчик должен быть в index.js
    // Этот вызов оставляем для совместимости, но он не будет работать правильно
    // messaging().setBackgroundMessageHandler уже зарегистрирован в index.js
    
    // Обработчик для уведомлений когда приложение на переднем плане
    messaging().onMessage(async remoteMessage => {
      console.log('🟢🟢🟢 УВЕДОМЛЕНИЕ НА ПЕРЕДНЕМ ПЛАНЕ! 🟢🟢🟢');
      console.log('📨 Полные данные:', JSON.stringify(remoteMessage, null, 2));
      console.log('📋 Notification title:', remoteMessage.notification?.title);
      console.log('📋 Notification body:', remoteMessage.notification?.body);
      console.log('📦 Data payload:', remoteMessage.data);
      
      // Обрабатываем данные уведомления
      await this.handleNotificationData(remoteMessage);
      
      // Показываем системное уведомление
      await this.displayLocalNotification(
        remoteMessage.notification?.title || 'Уведомление',
        remoteMessage.notification?.body || '',
        remoteMessage.data
      );
    });

    // Обработчик для клика по уведомлению
    messaging().onNotificationOpenedApp(async remoteMessage => {
      console.log('👆 Клик по уведомлению (приложение в фоне):', remoteMessage);
      
      // Обрабатываем данные
      await this.handleNotificationData(remoteMessage);
      
      // Здесь можно добавить навигацию к экрану заказа
      if (remoteMessage.data?.order) {
        try {
          const orderData = typeof remoteMessage.data.order === 'string' 
            ? JSON.parse(remoteMessage.data.order) 
            : remoteMessage.data.order;
          const orderId = orderData._id || orderData.orderId;
          
          console.log('📱 Навигация к заказу:', orderId);
          // NavigationService.navigate('OrderStatus', { orderId });
        } catch (error) {
          console.error('❌ Ошибка навигации:', error);
        }
      }
    });

    // Проверка, было ли приложение открыто через уведомление
    messaging()
      .getInitialNotification()
      .then(async remoteMessage => {
        if (remoteMessage) {
          console.log('🚀 Приложение открыто через уведомление:', remoteMessage);
          
          // Обрабатываем данные
          await this.handleNotificationData(remoteMessage);
          
          // Навигация с задержкой для загрузки приложения
          if (remoteMessage.data?.order) {
            setTimeout(() => {
              try {
                if (!remoteMessage.data) return;
                
                const orderData = typeof remoteMessage.data.order === 'string' 
                  ? JSON.parse(remoteMessage.data.order) 
                  : remoteMessage.data.order;
                const orderId = orderData._id || orderData.orderId;
                
                console.log('📱 Навигация к заказу при запуске:', orderId);
                // NavigationService.navigate('OrderStatus', { orderId });
              } catch (error) {
                console.error('❌ Ошибка навигации при запуске:', error);
              }
            }, 1000);
          }
        }
      });

    // Обработчик обновления токена
    messaging().onTokenRefresh(async token => {
      console.log('🔄 FCM токен обновлен:', token);
      this.fcmToken = token;
      await AsyncStorage.setItem('fcmToken', token);
      
      // Проверяем userMail и отправляем токен
      const userMail = await AsyncStorage.getItem('userMail');
      if (userMail) {
        await this.sendTokenToServer(token);
      }
    });
  }

  // Повторная отправка токена на сервер (вызывать после логина)
  async resendToken() {
    console.log('🔄 Повторная отправка токена на сервер...');
    const userMail = await AsyncStorage.getItem('userMail');
    
    if (!userMail) {
      console.log('⚠️ userMail не найден, пропускаем отправку токена');
      return;
    }
    
    // Если токен уже получен, отправляем его на сервер
    if (this.fcmToken) {
      await this.sendTokenToServer(this.fcmToken);
    } else {
      // Если токена нет, пытаемся получить его
      console.log('⚠️ FCM токен не найден, пытаемся получить');
      await this.getFCMToken();
    }
  }

  // Очистка при выходе
  async clearToken() {
    try {
      if (this.fcmToken) {
        await messaging().deleteToken();
        await AsyncStorage.removeItem('fcmToken');
        this.fcmToken = null;
        console.log('✅ FCM токен удален');
      }
    } catch (error) {
      console.error('Ошибка при удалении токена:', error);
    }
  }

  // Получить текущий токен
  getToken(): string | null {
    return this.fcmToken;
  }

  // Проверить статус разрешения на уведомления
  async checkPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const result = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        console.log('🔍 Статус разрешения POST_NOTIFICATIONS:', result);
        return result;
      }
      
      // Для iOS или старых Android
      const authStatus = await messaging().hasPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      console.log('🔍 Статус разрешения Firebase:', enabled);
      return enabled;
    } catch (error) {
      console.error('❌ Ошибка проверки разрешения:', error);
      return false;
    }
  }
}

export default new PushNotificationService();

