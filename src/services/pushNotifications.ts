import {
  Alert,
  Platform,
  DeviceEventEmitter,
  PermissionsAndroid,
  InteractionManager,
  AppState,
  type AppStateStatus,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

const API_URL = 'https://api.tibetskayacrm.kz';


class PushNotificationService {
  private static instance: PushNotificationService;
  private fcmToken: string | null = null;
  private isInitialized: boolean = false; // Защита от повторной инициализации
  private listenersRegistered: boolean = false; // Защита от повторной регистрации обработчиков
  private unsubscribeFunctions: Array<() => void> = []; // Функции отписки от обработчиков
  private notificationsEnabled: boolean = true; // Состояние включения/отключения уведомлений

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Инициализация push-уведомлений
   */
  async init() {
    // Проверяем, включены ли уведомления
    const enabled = await this.isNotificationsEnabled();
    if (!enabled) {
      console.log('⚠️ Уведомления отключены пользователем, пропускаем инициализацию');
      return;
    }

    if (this.isInitialized) {
      console.log('⚠️ Push notifications уже инициализированы, пропускаем');
      return;
    }
    
    console.log('🔔 Начало инициализации push notifications...');
    console.log('📱 Платформа:', Platform.OS, 'Версия:', Platform.Version);

    // Android: не вызываем нативный код, пока MainActivity не готова (useAuth стартует очень рано)
    if (Platform.OS === 'android') {
      await new Promise<void>((resolve) => setTimeout(resolve, 1200));
      await this.waitUntilActivityReadyForPermissions();
    }

    // 0. Создаем канал уведомлений для Android (после ожидания Activity)
    if (Platform.OS === 'android') {
      await this.createNotificationChannel();
    }

    // 1. Запрашиваем разрешение пользователя
    const granted = await this.requestPermission();
    if (!granted) {
      console.log('❌ Пользователь отклонил разрешение на уведомления');
      console.log('💡 Проверьте настройки приложения: Настройки → Приложения → tibetskayaClientApp → Уведомления');
      return;
    }

    // 2. Только для iOS: Явная регистрация в APNs
    if (Platform.OS === 'ios') {
      try {
        console.log('⏳ iOS: Регистрируем устройство в APNs...');
        
        // Этот метод сам связывается с iOS и ждет получения APNs токена
        // Если capability "Push Notifications" не включена, он упадет или зависнет
        await messaging().registerDeviceForRemoteMessages();
        
        console.log('✅ iOS: Устройство зарегистрировано в APNs');
      } catch (error) {
        console.error('❌ Ошибка регистрации в APNs:', error);
        // Если здесь ошибка, то getToken дальше 100% не сработает
        return; 
      }
    }

    // 3. Теперь безопасно получаем FCM токен
    try {
      await this.getFCMToken();
      this.initializeNotificationListeners();
      this.isInitialized = true;
    } catch (error) {
       console.error('❌ Ошибка инициализации FCM:', error);
    }
  }

  /**
   * iOS: Регистрация устройства для удаленных сообщений в Firebase
   * ВАЖНО: Должна вызываться ПОСЛЕ получения APNs токена (который устанавливается в AppDelegate)
   */
  private async registerForRemoteMessages(): Promise<void> {
    if (Platform.OS !== 'ios') {
      return; // Только для iOS
    }

    try {
      // Проверяем, не зарегистрировано ли уже устройство
      const isRegistered = messaging().isDeviceRegisteredForRemoteMessages;
      if (isRegistered) {
        console.log('✅ iOS: Устройство уже зарегистрировано для удаленных сообщений');
        return;
      }

      console.log('🔍 iOS: Регистрация устройства для удаленных сообщений в Firebase...');
      await messaging().registerDeviceForRemoteMessages();
      console.log('✅ iOS: Устройство успешно зарегистрировано для удаленных сообщений');
    } catch (error: any) {
      const errorCode = error?.code || 'unknown';
      const errorMessage = error?.message || String(error);
      
      console.error('❌ iOS: Ошибка регистрации устройства:', errorMessage);
      console.error('   Код:', errorCode);
      
      // Если это ошибка "system did not respond", возможно APNs токен еще не получен
      if (errorCode === 'messaging/unknown-error') {
        console.error('   ⚠️ Возможно, APNs токен еще не получен или не установлен в Firebase Messaging');
        console.error('   Проверьте логи AppDelegate - должен быть "✅ [AppDelegate] APNs token registered"');
        console.error('   Попробуем получить токен все равно, возможно регистрация произойдет автоматически');
      }
      
      // Не пробрасываем ошибку дальше, пробуем получить токен все равно
      // Firebase может автоматически зарегистрировать устройство при вызове getToken()
    }
  }

  /**
   * На Android запрос разрешений через PermissionsAndroid / системные диалоги
   * возможен только когда Activity уже прикреплена. Ранний вызов из useAuth даёт:
   * IllegalStateException: Tried to use permissions API while not attached to an Activity.
   */
  private async waitUntilActivityReadyForPermissions(): Promise<void> {
    if (Platform.OS === 'android' && AppState.currentState !== 'active') {
      await Promise.race([
        new Promise<void>((resolve) => {
          const sub = AppState.addEventListener(
            'change',
            (next: AppStateStatus) => {
              if (next === 'active') {
                sub.remove();
                resolve();
              }
            }
          );
        }),
        new Promise<void>((resolve) => setTimeout(resolve, 10000)),
      ]);
    }

    await new Promise<void>((resolve) => {
      InteractionManager.runAfterInteractions(() => {
        // После первого кадра MainActivity обычно уже прикреплена
        setTimeout(() => resolve(), Platform.OS === 'android' ? 1200 : 0);
      });
    });
  }

  /**
   * Запрос разрешений
   */
  private async requestPermission(): Promise<boolean> {
    try {
      await this.waitUntilActivityReadyForPermissions();

      // Для Android 13+ нужно запрашивать POST_NOTIFICATIONS отдельно
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        console.log('📱 Android 13+: Запрашиваем разрешение POST_NOTIFICATIONS');
        let granted: string = PermissionsAndroid.RESULTS.DENIED;
        const maxAttempts = 4;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            await this.waitUntilActivityReadyForPermissions();
            granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
              {
                title: 'Разрешение на уведомления',
                message: 'Приложению нужно разрешение для отправки уведомлений о заказах',
                buttonNeutral: 'Позже',
                buttonNegative: 'Отмена',
                buttonPositive: 'OK',
              }
            );
            break;
          } catch (err: unknown) {
            const msg = String((err as Error)?.message ?? err);
            const isActivity =
              msg.includes('Activity') || msg.includes('IllegalStateException');
            if (isActivity && attempt < maxAttempts) {
              console.warn(
                `[Push] POST_NOTIFICATIONS попытка ${attempt}/${maxAttempts}, ждём Activity...`
              );
              await new Promise<void>((r) => setTimeout(r, 400 * attempt));
              continue;
            }
            throw err;
          }
        }

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('❌ Android: Разрешение POST_NOTIFICATIONS отклонено');
          return false;
        }
        console.log('✅ Android: Разрешение POST_NOTIFICATIONS получено');
        await new Promise<void>((r) => setTimeout(r, 300));
      }

      // Запрашиваем разрешение через Firebase Messaging
      const status = await messaging().requestPermission();
  
      if (
        status === messaging.AuthorizationStatus.AUTHORIZED ||
        status === messaging.AuthorizationStatus.PROVISIONAL
      ) {
        console.log('✅ Firebase: Разрешение на уведомления получено:', status);
        return true;
      }
      
      console.log('❌ Firebase: Разрешение на уведомления отклонено:', status);
      return false;
    } catch (e) {
      console.error('❌ Ошибка запроса разрешений:', e);
      return false;
    }
  }

  /**
   * Получение токена
   */
  private async getFCMToken(): Promise<string | null> {
    try {
      // В React Native Firebase используем messaging().getToken()
      // Делаем несколько попыток для iOS, так как регистрация может быть еще не завершена
      let token: string | null = null;
      const maxRetries = Platform.OS === 'ios' ? 3 : 1;
      const retryDelay = 1000;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          token = await messaging().getToken();
          if (token) {
            console.log(`✅ FCM токен получен на попытке ${attempt}`);
            break;
          }
        } catch (error: any) {
          const errorCode = error?.code || 'unknown';
          
          // Если это ошибка unregistered и это не последняя попытка
          if (errorCode === 'messaging/unregistered' && attempt < maxRetries) {
            console.log(`⚠️ Устройство еще не зарегистрировано, попытка ${attempt}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }
          
          // Если это последняя попытка, пробрасываем ошибку
          if (attempt === maxRetries) {
            throw error;
          }
        }
      }

      if (!token) {
        console.error('❌ FCM токен не получен после всех попыток');
        return null;
      }

      this.fcmToken = token;
      await AsyncStorage.setItem('fcmToken', token);

      const mail = await AsyncStorage.getItem('userMail');
      if (mail) {
        await this.sendTokenToServer(token);
      }

      return token;
    } catch (error: any) {
      console.error('❌ Ошибка получения FCM токена:', error);
      console.error('   Код ошибки:', error?.code);
      console.error('   Сообщение:', error?.message);
      
      if (error?.code === 'messaging/unregistered') {
        console.error('   ⚠️ Устройство не зарегистрировано для удаленных сообщений');
        console.error('   Проверьте логи AppDelegate - должен быть "✅ [AppDelegate] APNs token registered"');
      }
      
      return null;
    }
  }

  /**
   * Отправка токена на сервер
   */
  private async sendTokenToServer(token: string): Promise<void> {
    try {
      const userMail = await AsyncStorage.getItem('userMail');
      if (!userMail) {
        console.log('⚠️ Email пользователя не найден, токен не отправлен');
        return;
      }

      await axios.post(
        `${API_URL}/saveFcmToken`,
        {
          mail: userMail,
          fcmToken: token,
          platform: Platform.OS,
        }
      );
      console.log('✅ Токен успешно отправлен на сервер');
    } catch (error: any) {
      console.error('❌ Ошибка отправки токена на сервер:', error);
      if (error.response) {
        console.error('   Статус:', error.response.status);
        console.error('   Данные:', error.response.data);
      }
    }
  }

  /**
   * Создание канала уведомлений для Android
   */
  private async createNotificationChannel() {
    if (Platform.OS === 'android') {
      try {
        const channelId = await notifee.createChannel({
          id: 'orders_v2',
          name: 'Уведомления о заказах',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
        });
        console.log('✅ Канал уведомлений создан:', channelId);
      } catch (error) {
        console.error('❌ Ошибка создания канала уведомлений:', error);
      }
    }
  }

  /**
   * Показ локального уведомления (для foreground)
   */
  private async displayLocalNotification(title: string, body: string, data?: any) {
    try {
      let channelId = 'orders_v2';
      
      // Создаем канал для Android (если еще не создан)
      if (Platform.OS === 'android') {
        channelId = await notifee.createChannel({
          id: 'orders_v2',
          name: 'Уведомления о заказах',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
        });
      }

      await notifee.displayNotification({
        title,
        body,
        data,
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'default',
        },
      });
      
      console.log('✅ Локальное уведомление показано');
    } catch (error) {
      console.error('❌ Ошибка показа локального уведомления:', error);
      // Fallback на Alert если notifee не работает
      Alert.alert(title, body);
    }
  }

  /**
   * Регистрация listeners
   * В React Native Firebase методы вызываются на экземпляре messaging()
   * ВАЖНО: Вызывается только один раз при инициализации
   */
  private initializeNotificationListeners() {
    // Защита от повторной регистрации обработчиков
    if (this.listenersRegistered) {
      console.log('⚠️ Обработчики уведомлений уже зарегистрированы, пропускаем');
      console.trace('Стек вызовов:');
      return;
    }

    console.log('📝 Регистрация обработчиков уведомлений...');
    console.trace('Стек вызовов:');

    // Отписываемся от старых обработчиков (если есть)
    this.unsubscribeAllListeners();

    // Создаем канал уведомлений для Android
    this.createNotificationChannel();

    // Foreground уведомления (приложение открыто)
    const unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
      // Проверяем, включены ли уведомления
      if (!this.notificationsEnabled) {
        console.log('⚠️ Уведомления отключены, игнорируем сообщение');
        return;
      }

      console.log('🟢 Уведомление на переднем плане (messageId:', remoteMessage.messageId, ')');
      
      // Обрабатываем данные уведомления
      await this.handleNotificationData(remoteMessage);
      
      // Показываем локальное уведомление через notifee (выглядит как системное)
      const title = remoteMessage.notification?.title ?? 'Новое уведомление';
      const body = remoteMessage.notification?.body ?? 'Сообщение';
      await this.displayLocalNotification(title, body, remoteMessage.data);
    });

    // Уведомление открыто из фона
    const unsubscribeOnNotificationOpenedApp = messaging().onNotificationOpenedApp(async (remoteMessage) => {
      console.log('👆 Открыто из фона:', remoteMessage);
      await this.handleNotificationData(remoteMessage);
    });

    // Уведомление открыто при холодном старте (вызывается один раз при запуске)
    messaging()
      .getInitialNotification()
      .then(async (remoteMessage) => {
        if (remoteMessage) {
          console.log('🚀 Открыто при холодном старте:', remoteMessage);
          await this.handleNotificationData(remoteMessage);
        }
      });

    // Обновление токена
    const unsubscribeOnTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
      console.log('🔄 Обновлённый FCM токен:', newToken);
      this.fcmToken = newToken;
      await AsyncStorage.setItem('fcmToken', newToken);

      const userMail = await AsyncStorage.getItem('userMail');
      if (userMail) {
        await this.sendTokenToServer(newToken);
      }
    });

    // Сохраняем функции отписки
    this.unsubscribeFunctions.push(
      unsubscribeOnMessage,
      unsubscribeOnNotificationOpenedApp,
      unsubscribeOnTokenRefresh
    );

    this.listenersRegistered = true;
    console.log('✅ Обработчики уведомлений зарегистрированы');
  }

  /**
   * Отписка от всех обработчиков
   */
  private unsubscribeAllListeners() {
    this.unsubscribeFunctions.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('Ошибка при отписке от обработчика:', error);
      }
    });
    this.unsubscribeFunctions = [];
    this.listenersRegistered = false;
  }

  /**
   * Обработка данных уведомления
   */
  private async handleNotificationData(remoteMessage: any) {
    if (!remoteMessage.data) {
      console.log('⚠️ Нет данных в уведомлении');
      return;
    }

    console.log('📦 Данные уведомления:', JSON.stringify(remoteMessage.data, null, 2));

    const { newStatus, orderId, message, messageStatus } = remoteMessage.data;
    const status = newStatus || messageStatus;

    // Маркетинговые пуши: только системный баннер, без синхронизации заказов
    // (иначе orderStatusUpdated тянет чужой orderId через getOrder и может подмешать заказ в список)
    if (status === 'courierNearby') {
      console.log('ℹ️ Маркетинговое уведомление (курьер рядом), пропускаем обновление заказов');
      return;
    }

    // Обработка сообщений поддержки
    if (status === 'newSupportMessage' && message) {
      try {
        const messageData = typeof message === 'string' ? JSON.parse(message) : message;
        console.log('💬 Обработка нового сообщения поддержки:', messageData);
        
        // Отправляем событие для обновления чата
        console.log('📢 Отправка события newSupportMessage');
        DeviceEventEmitter.emit('newSupportMessage', messageData);
        console.log('✅ Событие newSupportMessage отправлено');
        return;
      } catch (error) {
        console.error('❌ Ошибка обработки сообщения поддержки:', error);
        console.error('   Данные:', remoteMessage.data);
        return;
      }
    }

    // Обработка уведомлений о заказах
    if (!status || !orderId) {
      console.log('⚠️ Нет статуса или данных заказа в уведомлении');
      return;
    }

    try {
      // Парсим данные заказа
      const finalOrderId = orderId;

      console.log('📋 Обработка заказа:', {
        orderId,
        status,
        isNewOrder: status === 'newOrder',
      });

      // // Если это новый заказ - сохраняем его
      // if (status === 'newOrder') {
      //   await AsyncStorage.setItem(
      //     `order_${orderId}`,
      //     JSON.stringify(orderData)
      //   );
      //   console.log('✅ Новый заказ сохранен:', orderId);
      //   return;
      // }

      // // Если это обновление статуса
      // const existingOrder = await AsyncStorage.getItem(`order_${finalOrderId}`);
      // let parsedOrder;

      // if (existingOrder) {
      //   // Обновляем существующий заказ
      //   parsedOrder = JSON.parse(existingOrder);
      //   parsedOrder.status = status;
      //   parsedOrder.updatedAt = new Date().toISOString();
      //   // Обновляем данные заказа из уведомления
      //   Object.assign(parsedOrder, orderData);
      // } else {
      //   // Если заказа нет в хранилище, сохраняем новый
      //   parsedOrder = orderData;
      //   parsedOrder.status = status;
      //   parsedOrder.updatedAt = new Date().toISOString();
      //   console.log('⚠️ Заказ не найден в хранилище, сохраняем новый');
      // }

      // // Сохраняем обновленный заказ
      // await AsyncStorage.setItem(`order_${finalOrderId}`, JSON.stringify(parsedOrder));

      // console.log('🔄 Статус заказа обновлен:', {
      //   orderId: finalOrderId,
      //   newStatus: status,
      //   previousStatus: existingOrder ? JSON.parse(existingOrder).status : 'не было',
      // });

      // // Уведомляем компоненты об обновлении
      // console.log('📢 Отправка события orderStatusUpdated');
      DeviceEventEmitter.emit('orderStatusUpdated', {
        orderId: finalOrderId,
        newStatus: status,
      });
      console.log('✅ Событие orderStatusUpdated отправлено');
    } catch (error) {
      console.error('❌ Ошибка обработки данных уведомления:', error);
      console.error('   Данные:', remoteMessage.data);
    }
  }

  /**
   * Повторная отправка токена на сервер (после логина)
   */
  async resendToken() {
    const userMail = await AsyncStorage.getItem('userMail');
    if (!userMail) {
      console.log('⚠️ userMail не найден, пропускаем отправку токена');
      return;
    }

    if (this.fcmToken) {
      await this.sendTokenToServer(this.fcmToken);
    } else {
      console.log('⚠️ FCM токен не найден, пытаемся получить');
      await this.getFCMToken();
    }
  }

  /**
   * Удаление текущего FCM-токена с сервера (при логауте)
   */
  async removeTokenFromServer(): Promise<void> {
    try {
      const userMail = await AsyncStorage.getItem('userMail');
      const token = this.fcmToken || await AsyncStorage.getItem('fcmToken');
      if (!userMail || !token) {
        console.log('⚠️ Нет данных для удаления токена с сервера');
        return;
      }
      await axios.post(`${API_URL}/removeFcmToken`, {
        mail: userMail,
        fcmToken: token,
      });
      console.log('✅ FCM токен удален с сервера');
    } catch (error: any) {
      console.error('❌ Ошибка удаления токена с сервера:', error?.message);
    }
  }

  /**
   * Получить текущий токен
   */
  getToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Проверка разрешений на уведомления
   */
  async checkPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        console.log('📱 Android 13+: Разрешение POST_NOTIFICATIONS:', granted ? '✅' : '❌');
        if (!granted) {
          return false;
        }
      }

      const authStatus = await messaging().hasPermission();
      const isAuthorized = 
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      console.log('📱 Firebase разрешение:', isAuthorized ? '✅' : '❌', 'Статус:', authStatus);
      return isAuthorized;
    } catch (error) {
      console.error('❌ Ошибка проверки разрешений:', error);
      return false;
    }
  }

  /**
   * Включение уведомлений
   */
  async enableNotifications(): Promise<boolean> {
    try {
      await AsyncStorage.setItem('notificationsEnabled', 'true');
      this.notificationsEnabled = true;
      console.log('✅ Уведомления включены');
      
      // Если еще не инициализированы, инициализируем
      if (!this.isInitialized) {
        await this.init();
      }
      
      return true;
    } catch (error) {
      console.error('❌ Ошибка включения уведомлений:', error);
      return false;
    }
  }

  /**
   * Отключение уведомлений
   */
  async disableNotifications(): Promise<boolean> {
    try {
      await AsyncStorage.setItem('notificationsEnabled', 'false');
      this.notificationsEnabled = false;
      console.log('❌ Уведомления отключены');
      
      // Отписываемся от всех обработчиков
      this.unsubscribeAllListeners();
      this.isInitialized = false;
      
      // Удаляем токен с сервера (опционально)
      // Можно добавить API endpoint для удаления токена
      
      return true;
    } catch (error) {
      console.error('❌ Ошибка отключения уведомлений:', error);
      return false;
    }
  }

  /**
   * Проверка, включены ли уведомления
   */
  async isNotificationsEnabled(): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem('notificationsEnabled');
      // По умолчанию уведомления включены (если значение не установлено)
      const enabled = stored !== 'false';
      this.notificationsEnabled = enabled;
      console.log('📱 Статус уведомлений:', enabled ? '✅ Включены' : '❌ Отключены');
      return enabled;
    } catch (error) {
      console.error('❌ Ошибка проверки статуса уведомлений:', error);
      // По умолчанию возвращаем true
      return true;
    }
  }
}

export default PushNotificationService.getInstance();
