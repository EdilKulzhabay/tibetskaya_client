import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseCore
import FirebaseMessaging
import UserNotifications
import FBSDKCoreKit
import AppTrackingTransparency
import PushKit
import RNCallKeep
import RNVoipPushNotification

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  /// Запрос ATT уже отправлен и ждёт ответа — не дублируем его на повторных didBecomeActive
  private var isTrackingAuthorizationPending = false

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // 1. Инициализация Firebase (должно быть первым)
    FirebaseApp.configure()

    // 1.1 Инициализация Facebook SDK (App Events)
    ApplicationDelegate.shared.application(
      application,
      didFinishLaunchingWithOptions: launchOptions
    )

    // 2. Настройка делегатов для push-уведомлений
    UNUserNotificationCenter.current().delegate = self
    Messaging.messaging().delegate = self
    
    // 3. ⚠️ КРИТИЧЕСКИ ВАЖНО: Регистрация для удаленных уведомлений сразу после Firebase.configure()
    // Это должно быть вызвано синхронно, не внутри completion handler
    application.registerForRemoteNotifications()
    print("📱 [AppDelegate] Зарегистрировано для удаленных уведомлений")

    // 4. CallKit и PushKit — до запуска React Native: VoIP-пуш может разбудить убитое приложение,
    // и CallKit нужно показать раньше, чем загрузится JS
    setUpIncomingCalls()

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "tibetskayaClientApp",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  // MARK: - Facebook SDK

  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    ApplicationDelegate.shared.application(app, open: url, options: options)
  }

  // MARK: - App Tracking Transparency (iOS 14+)

  func applicationDidBecomeActive(_ application: UIApplication) {
    requestTrackingAuthorizationIfNeeded()
  }

  /// iOS не показывает диалог ATT, пока на экране другой системный алерт (например, запрос
  /// уведомлений), и молча возвращает .notDetermined. Поэтому ориентируемся на текущий статус,
  /// а не на флаг «уже спрашивали»: закрытие чужого алерта снова вызывает didBecomeActive,
  /// и запрос повторится.
  private func requestTrackingAuthorizationIfNeeded() {
    guard !isTrackingAuthorizationPending,
          ATTrackingManager.trackingAuthorizationStatus == .notDetermined else { return }
    isTrackingAuthorizationPending = true

    // Небольшая задержка, чтобы системный диалог ATT не появился поверх ещё не отрисованного UI
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
      guard UIApplication.shared.applicationState == .active else {
        self?.isTrackingAuthorizationPending = false
        return
      }
      ATTrackingManager.requestTrackingAuthorization { status in
        print("📱 [AppDelegate] ATT authorization status: \(status.rawValue)")
        DispatchQueue.main.async { self?.isTrackingAuthorizationPending = false }
      }
    }
  }

  // MARK: - Push Notifications
  
  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    // ⚠️ КРИТИЧЕСКИ ВАЖНО: Устанавливаем APNs токен в Firebase Messaging
    // Без этого FCM токен не может быть получен
    Messaging.messaging().apnsToken = deviceToken
    print("✅ [AppDelegate] APNs token registered и установлен в Firebase Messaging")
    print("📱 [AppDelegate] Теперь можно получить FCM токен через messaging().getToken()")
  }
  
  func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("❌ Failed to register for remote notifications: \(error.localizedDescription)")
    print("❌ Error details: \(error)")
    
    // Дополнительная информация об ошибке
    if let nsError = error as NSError? {
      print("❌ Error domain: \(nsError.domain)")
      print("❌ Error code: \(nsError.code)")
      print("❌ Error userInfo: \(nsError.userInfo)")
      
      // Распространенные ошибки и их решения
      switch nsError.code {
      case 3010:
        print("⚠️ ОШИБКА 3010: Push notifications не поддерживаются на симуляторе!")
        print("   Решение: Используйте физическое устройство для тестирования")
      case 3000:
        print("⚠️ ОШИБКА 3000: Не удалось получить APNs токен")
        print("   Решение: Проверьте настройки Push Notifications в Xcode")
      case 3001:
        print("⚠️ ОШИБКА 3001: Неверный Bundle ID или сертификаты")
        print("   Решение: Проверьте Bundle ID и APNs сертификаты в Firebase Console")
      default:
        print("⚠️ Неизвестная ошибка регистрации push-уведомлений")
      }
    }
  }
  
  // Получение FCM токена
  func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
    if let token = fcmToken {
      print("📱 FCM Token получен: \(token)")
    } else {
      print("⚠️ FCM Token получен, но значение nil")
    }
  }
  
  // Обработка уведомления на переднем плане
  func userNotificationCenter(_ center: UNUserNotificationCenter,
                             willPresent notification: UNNotification,
                             withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    completionHandler([[.alert, .sound, .badge]])
  }
  
  // Обработка клика по уведомлению
  func userNotificationCenter(_ center: UNUserNotificationCenter,
                             didReceive response: UNNotificationResponse,
                             withCompletionHandler completionHandler: @escaping () -> Void) {
    print("👆 Notification tapped")
    completionHandler()
  }
}

// MARK: - Входящие VoIP-звонки (PushKit + CallKit)

extension AppDelegate: PKPushRegistryDelegate {
  /// CXCallEndedReason.unanswered — для звонков, которые уже не актуальны к приходу пуша
  private static let unansweredEndReason: Int32 = 3

  /// Опции совпадают с CallKit-частью JS (src/features/calls/callPlatform.ios.ts)
  func setUpIncomingCalls() {
    RNCallKeep.setup([
      "appName": "Тибетская",
      "supportsVideo": false,
      "maximumCallGroups": "1",
      "maximumCallsPerCallGroup": "1",
      "includesCallsInRecents": false,
    ])
    // Делегатом PKPushRegistry становится AppDelegate (методы ниже)
    RNVoipPushNotificationManager.voipRegistration()
  }

  func pushRegistry(
    _ registry: PKPushRegistry,
    didUpdate pushCredentials: PKPushCredentials,
    for type: PKPushType
  ) {
    RNVoipPushNotificationManager.didUpdate(pushCredentials, forType: type.rawValue)
  }

  func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {
    // Токен удалит сервер по ответу APNs (410 Unregistered)
  }

  /// iOS требует показать CallKit на КАЖДЫЙ VoIP-пуш — иначе система перестанет их доставлять.
  /// Поэтому даже просроченный или битый пуш показываем и сразу завершаем.
  func pushRegistry(
    _ registry: PKPushRegistry,
    didReceiveIncomingPushWith payload: PKPushPayload,
    for type: PKPushType,
    completion: @escaping () -> Void
  ) {
    let data = payload.dictionaryPayload
    let callUuid = (data["callUuid"] as? String).flatMap { UUID(uuidString: $0)?.uuidString }
    let uuid = callUuid ?? UUID().uuidString
    let callerName = (data["callerName"] as? String) ?? "Входящий звонок"
    let expiresAtMs = (data["expiresAt"] as? NSNumber)?.doubleValue ?? 0
    let isActual = callUuid != nil && expiresAtMs > Date().timeIntervalSince1970 * 1000

    // Событие для JS (если он уже загружен — сразу, иначе в очереди до загрузки)
    RNVoipPushNotificationManager.didReceiveIncomingPush(with: payload, forType: type.rawValue)

    RNCallKeep.reportNewIncomingCall(
      uuid,
      handle: callerName,
      handleType: "generic",
      hasVideo: false,
      localizedCallerName: callerName,
      supportsHolding: false,
      supportsDTMF: false,
      supportsGrouping: false,
      supportsUngrouping: false,
      fromPushKit: true,
      payload: data,
      withCompletionHandler: {
        if !isActual {
          RNCallKeep.endCall(withUUID: uuid, reason: AppDelegate.unansweredEndReason)
        }
        completion()
      }
    )
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
