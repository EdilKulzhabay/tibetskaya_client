import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import { apiService } from '../api/services';

const SCREEN_H = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_H * 0.9;

interface PaymentWebViewProps {
  visible: boolean;
  onClose: (paymentCompleted: boolean) => void;
  amount: number;
  userId: string;
  userEmail?: string;
  userPhone?: string;
}

const PaymentWebView: React.FC<PaymentWebViewProps> = ({
  visible,
  onClose,
  amount,
  userId,
  userEmail,
  userPhone,
}) => {
  const [loading, setLoading] = useState(true);
  const [widgetUrl, setWidgetUrl] = useState<string | null>(null);
  const [sessionOrderId, setSessionOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const paymentCompletedRef = useRef(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Загружаем конфиг виджета и получаем URL страницы (origin = api.tibetskayacrm.kz)
  const loadWidgetConfig = useCallback(async () => {
    console.log('[PaymentWebView] loadWidgetConfig:', { userId, amount });
    setLoading(true);
    setError(null);
    paymentCompletedRef.current = false;
    setSessionOrderId(null);

    if (!userId) {
      setError('Необходимо войти в аккаунт');
      setLoading(false);
      return;
    }

    try {
      const config = await apiService.getWidgetConfig(userId, amount, userEmail, userPhone);
      console.log('[PaymentWebView] Конфиг:', { success: config?.success, hasUrl: !!config?.widgetPageUrl });

      if (!config.success) {
        setError(config.message || 'Не удалось загрузить платёжную форму');
        setLoading(false);
        return;
      }

      const paymentUrl = config.paymentUrl as string | undefined;
      const widgetPageUrl = config.widgetPageUrl as string | undefined;
      const orderId = config.orderId as string | undefined;
      if (orderId) {
        setSessionOrderId(orderId);
      }

      // Прямая ссылка на форму оплаты (ventrapay.net, easypayly.com и т.д.) — не требовать подстроку "payplus"
      const url =
        paymentUrl && paymentUrl.startsWith('http')
          ? paymentUrl
          : widgetPageUrl && widgetPageUrl.startsWith('http')
            ? widgetPageUrl
            : null;
      console.log('[PaymentWebView] URL для загрузки:', url ? (url === paymentUrl ? 'paymentUrl' : 'widgetPageUrl') : 'нет', { orderId });
      if (!url) {
        setError('Сервер не вернул URL платёжной формы');
        setLoading(false);
        return;
      }
      setWidgetUrl(url);
    } catch (err: any) {
      console.error('[PaymentWebView] Ошибка:', err?.message);
      setError('Ошибка при загрузке платёжной формы');
    } finally {
      setLoading(false);
    }
  }, [userId, amount, userEmail, userPhone]);

  // При открытии модалки загружаем конфиг
  React.useEffect(() => {
    if (visible) {
      loadWidgetConfig();
    } else {
      setWidgetUrl(null);
      setSessionOrderId(null);
      setError(null);
      setLoading(true);
    }
  }, [visible, loadWidgetConfig]);

  /** Опрос статуса на CRM: callback Payplus обновляет баланс до того, как WebView попадёт на success_url */
  useEffect(() => {
    if (!visible || !sessionOrderId || !userId || paymentCompletedRef.current) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    const tick = async () => {
      if (paymentCompletedRef.current) return;
      try {
        const res = await apiService.getPaymentSessionStatus(userId, sessionOrderId);
        if (!res?.success || !res.status) return;
        if (res.status === 'success') {
          paymentCompletedRef.current = true;
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          setTimeout(() => onCloseRef.current(true), 400);
        } else if (res.status === 'fail') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          Alert.alert('Оплата', 'Платёж не прошёл или отменён.');
        }
      } catch {
        /* сеть */
      }
    };

    void tick();
    pollingRef.current = setInterval(tick, 2500);
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [visible, sessionOrderId, userId]);

  const isPaymentSuccessUrl = (raw: string) => {
    const u = raw.toLowerCase();
    return (
      u.includes('/api/payment/success') ||
      u.includes('/payment/success') ||
      u.includes('payment-success') ||
      u.includes('co_inv_st=success')
    );
  };

  // Обработка сообщений из WebView
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      switch (data.type) {
        case 'payment-success':
          paymentCompletedRef.current = true;
          setTimeout(() => onCloseRef.current(true), 800);
          break;
        case 'payment-error':
          console.error('[PaymentWebView] payment-error:', data.message);
          Alert.alert('Ошибка оплаты', data.message || 'Платёж не прошёл');
          break;
        case 'close':
          onCloseRef.current(paymentCompletedRef.current);
          break;
        case 'widget-loaded':
          console.log('[PaymentWebView] Виджет загружен, origin = api.tibetskayacrm.kz');
          break;
        default:
          console.log('[PaymentWebView] Неизвестный тип сообщения:', data.type);
      }
    } catch (e) {
      console.log('[PaymentWebView] WebView message parse error:', e);
    }
  };

  // Перехватываем навигацию для обнаружения success/failure URLs
  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const url = navState.url || '';
    if (isPaymentSuccessUrl(url)) {
      paymentCompletedRef.current = true;
      setTimeout(() => onCloseRef.current(true), 800);
    } else {
      const low = url.toLowerCase();
      if (low.includes('/payment/error') || low.includes('payment-error') || low.includes('payment-failure')) {
        Alert.alert('Ошибка', 'Платёж не прошёл');
      }
    }
  };

  const handleShouldStartLoad = (request: any) => {
    const url = String(request?.url || request?.nativeEvent?.url || '');
    if (isPaymentSuccessUrl(url)) {
      paymentCompletedRef.current = true;
      setTimeout(() => onCloseRef.current(true), 800);
      return false;
    }
    const low = url.toLowerCase();
    if (low.includes('/payment/error') || low.includes('payment-error')) {
      Alert.alert('Ошибка', 'Платёж не прошёл');
      return false;
    }
    return true;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent={Platform.OS === 'android'}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
      onRequestClose={() => onCloseRef.current(paymentCompletedRef.current)}
    >
      <View style={styles.modalRoot}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => onCloseRef.current(paymentCompletedRef.current)}
        />
        <View style={styles.sheet}>
          <SafeAreaView style={styles.container}>
            {/* Шапка */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => onCloseRef.current(paymentCompletedRef.current)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Оплата {amount.toLocaleString('ru-RU')} ₸</Text>
              <View style={styles.closeBtn} />
            </View>

            {/* Контент */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#DC1818" />
                <Text style={styles.loadingText}>Загрузка платёжной формы...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={loadWidgetConfig}
                >
                  <Text style={styles.retryBtnText}>Попробовать снова</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => onCloseRef.current(false)}
                >
                  <Text style={styles.cancelBtnText}>Отмена</Text>
                </TouchableOpacity>
              </View>
            ) : widgetUrl ? (
              <WebView
                ref={webViewRef}
                source={{ uri: widgetUrl }}
                style={styles.webView}
                onMessage={handleMessage}
                onNavigationStateChange={handleNavigationStateChange}
                onShouldStartLoadWithRequest={handleShouldStartLoad}
                onHttpError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  const statusCode = nativeEvent?.statusCode;
                  console.error('[PaymentWebView] HTTP ошибка:', statusCode, nativeEvent?.description);
                  if (statusCode === 404) {
                    setError(
                      'Платёжная форма недоступна (404). Возможно, нужен другой PAYPLUS_BASE_URL. ' +
                        'Свяжитесь с поддержкой Pay Plus (support@payplus.kz) для получения правильного URL API.'
                    );
                  } else {
                    setError(`Ошибка загрузки страницы (${statusCode || 'HTTP'}). Попробуйте позже.`);
                  }
                }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                mixedContentMode="compatibility"
                originWhitelist={['*']}
                thirdPartyCookiesEnabled={true}
                startInLoadingState={false}
              />
            ) : null}
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    height: SHEET_HEIGHT,
    width: '100%',
    backgroundColor: '#f6f6f6',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E3E3',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#101010',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#DC1818',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: '#DC1818',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 12,
  },
  retryBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    paddingVertical: 12,
  },
  cancelBtnText: {
    color: '#0d74d0',
    fontSize: 15,
    fontWeight: '600',
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f6f6',
  },
});

export default PaymentWebView;
