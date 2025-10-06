import messaging from '@react-native-firebase/messaging';
import { Platform, Alert, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'https://api.tibetskayacrm.kz';

class PushNotificationService {
  private userId: string | null = null;
  private fcmToken: string | null = null;

  // Инициализация сервиса
  async initialize(userId?: string) {
    console.log('🔔 Инициализация push-уведомлений...');
    
    if (userId) {
      this.userId = userId;
    }

    // Запрос разрешения
    const authStatus = await this.requestPermission();
    
    if (authStatus) {
      // Получение FCM токена
      await this.getFCMToken();
      
      // Настройка обработчиков
      this.setupNotificationHandlers();
    }
  }

  // Запрос разрешения на уведомления
  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ Разрешение на уведомления получено');
        return true;
      } else {
        console.log('❌ Разрешение на уведомления отклонено');
        return false;
      }
    } catch (error) {
      console.error('Ошибка при запросе разрешения:', error);
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
      
      // Отправляем токен на сервер
      if (this.userId) {
        await this.sendTokenToServer(token);
      }
      
      return token;
    } catch (error) {
      console.error('Ошибка при получении FCM токена:', error);
      return null;
    }
  }

  // Отправка токена на сервер
  async sendTokenToServer(token: string): Promise<void> {
    try {
      // Получаем email пользователя из AsyncStorage
      const userMail = await AsyncStorage.getItem('userMail');
      
      if (!userMail) {
        console.log('⚠️ Email пользователя не найден, токен не отправлен');
        return;
      }

      console.log('📤 Отправка FCM токена на сервер для:', userMail);
      
      await axios.post(
        `${API_URL}/saveFcmToken`,
        {
          mail: userMail,
          fcmToken: token,
          platform: Platform.OS,
        }
      );
      
      console.log('✅ FCM токен отправлен на сервер');
    } catch (error) {
      console.error('Ошибка при отправке токена на сервер:', error);
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
    // Обработчик для фоновых уведомлений
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('📬 Фоновое уведомление:', remoteMessage);
      await this.handleNotificationData(remoteMessage);
    });

    // Обработчик для уведомлений когда приложение на переднем плане
    messaging().onMessage(async remoteMessage => {
      console.log('📨 Уведомление на переднем плане:', remoteMessage);
      
      // Обрабатываем данные уведомления
      await this.handleNotificationData(remoteMessage);
      
      // Показываем алерт на iOS
      if (Platform.OS === 'ios') {
        Alert.alert(
          remoteMessage.notification?.title || 'Уведомление',
          remoteMessage.notification?.body || '',
          [
            {
              text: 'Просмотреть',
              onPress: () => {
                console.log('👆 Пользователь нажал "Просмотреть"');
                // Здесь можно добавить навигацию
              },
            },
            { text: 'OK' },
          ]
        );
      }
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
      
      if (this.userId) {
        await this.sendTokenToServer(token);
      }
    });
  }

  // Установка userId
  setUserId(userId: string) {
    this.userId = userId;
    
    // Если токен уже получен, отправляем его на сервер
    if (this.fcmToken) {
      this.sendTokenToServer(this.fcmToken);
    }
  }

  // Очистка при выходе
  async clearToken() {
    try {
      if (this.fcmToken) {
        await messaging().deleteToken();
        await AsyncStorage.removeItem('fcmToken');
        this.fcmToken = null;
        this.userId = null;
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
}

export default new PushNotificationService();

