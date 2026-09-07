import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  Linking,
  AppState,
  InteractionManager,
  KeyboardAvoidingView,
  ActivityIndicator,
  Image,
} from 'react-native';
import Pdf from 'react-native-pdf';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import {useAuth} from '../hooks/useAuth';
import PaymentWebView from '../components/PaymentWebView';
import {navigate} from '../navigation/navigationRef';
import {getClientMongoId} from '../utils/clientId';
import {clientHasInvoiceLegalData} from '../utils/clientInvoiceProfile';
import {apiService} from '../api/services';
import type {User} from '../types';

/** Очищает base64 от пробелов/префикса data-URI — иначе на iOS PDF может не открыться. */
function normalizePdfBase64(raw: string): string {
  let s = String(raw || '')
    .trim()
    .replace(/\s/g, '');
  const dataPrefix = /^data:application\/pdf;base64,/i;
  if (dataPrefix.test(s)) {
    s = s.replace(dataPrefix, '');
  }
  return s;
}

function pdfDataUri(raw: string): string {
  return `data:application/pdf;base64,${normalizePdfBase64(raw)}`;
}

/** Монохромная иконка «Поделиться» (контур без внешних зависимостей) */
function ShareGlyph({color = '#333'}: {color?: string}) {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}>
      <View style={{position: 'absolute', top: 1, alignItems: 'center'}}>
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: 5,
            borderRightWidth: 5,
            borderBottomWidth: 6,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: color,
          }}
        />
        <View
          style={{width: 2, height: 6, backgroundColor: color, marginTop: -1}}
        />
      </View>
      <View
        style={{
          width: 16,
          height: 7,
          borderWidth: 2,
          borderColor: color,
          borderTopWidth: 0,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
        }}
      />
    </View>
  );
}

type TopUpBalanceContextValue = {
  openTopUpModal: (initialSum?: string, options?: TopUpModalOptions) => void;
};

type TopUpMethod = 'kaspi' | 'card';

/**
 * Черновик заказа, который нужно оформить сразу после пополнения (тот же формат,
 * что и параметры apiService.addOrder). Передаётся на сервер вместе со счётом Kaspi,
 * чтобы вебхук мог создать заказ сам — даже если клиент не вернётся в приложение.
 */
export type PendingOrderDraft = {
  clientId: string;
  address: any;
  products: {b12: number; b19: number};
  clientNotes: any[];
  date: {d: string; time: string};
  opForm: string;
  needCall: boolean;
  comment: string;
  /** Сколько бутылей каждого объёма клиент вернёт как обменную тару — без этого
   * сервер посчитает, что вся тара новая (как раньше), и добавит её стоимость. */
  emptyBottles?: {b12: number; b19: number};
};

type TopUpModalOptions = {
  title?: string;
  subtitle?: string;
  showCashPayment?: boolean;
  onCashPayment?: () => void;
  onTopUpSuccess?: (updatedUser?: User | null) => void;
  /** Если задан и пользователь оплачивает через Kaspi — заказ будет создан автоматически на сервере после оплаты. */
  pendingOrder?: PendingOrderDraft;
};

const TopUpBalanceContext = createContext<TopUpBalanceContextValue | null>(
  null,
);

export function useTopUpBalance(): TopUpBalanceContextValue {
  const ctx = useContext(TopUpBalanceContext);
  if (!ctx) {
    throw new Error(
      'useTopUpBalance должен использоваться внутри TopUpBalanceProvider',
    );
  }
  return ctx;
}

export const TopUpBalanceProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const {user, refreshUserData} = useAuth();
  const [topUpVisible, setTopUpVisible] = useState(false);
  const [topUpMethodsVisible, setTopUpMethodsVisible] = useState(false);
  const [topUpSum, setTopUpSum] = useState('');
  const [topUpMethod, setTopUpMethod] = useState<TopUpMethod>('card');
  const [topUpOptions, setTopUpOptions] = useState<TopUpModalOptions>({});
  const [topUpSubmitting, setTopUpSubmitting] = useState(false);
  const [paymentWebViewVisible, setPaymentWebViewVisible] = useState(false);
  const [paymentWebViewAmount, setPaymentWebViewAmount] = useState(0);
  const topUpBackdropSafeRef = useRef(true);
  const topUpMethodsBackdropSafeRef = useRef(true);
  const cashPaymentActionRef = useRef<(() => void) | null>(null);
  const topUpSuccessActionRef = useRef<
    ((updatedUser?: User | null) => void) | null
  >(null);
  const pendingKaspiInvoiceIdRef = useRef<string | null>(null);
  const kaspiStatusCheckingRef = useRef(false);
  const kaspiStatusCheckAttemptsRef = useRef(0);

  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [invoiceStep, setInvoiceStep] = useState<'form' | 'result'>('form');
  const [qty19Str, setQty19Str] = useState('');
  const [qty12Str, setQty12Str] = useState('');
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfPreviewVisible, setPdfPreviewVisible] = useState(false);
  const [pdfPreviewLocalUri, setPdfPreviewLocalUri] = useState<string | null>(
    null,
  );
  const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false);
  const pdfPreviewPathRef = useRef<string | null>(null);
  /** iOS: второй Modal поверх счёта часто не появляется; счёт временно скрываем и при закрытии PDF открываем снова */
  const reopenInvoiceAfterPdfRef = useRef(false);

  const armTopUpBackdrop = useCallback(
    (ref: React.MutableRefObject<boolean>) => {
      ref.current = false;
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          ref.current = true;
        }, 500);
      });
    },
    [],
  );

  const notifyTopUpSuccess = useCallback((updatedUser?: User | null) => {
    const action = topUpSuccessActionRef.current;
    topUpSuccessActionRef.current = null;
    action?.(updatedUser ?? null);
  }, []);

  const openTopUpAmountSheet = useCallback(
    (method: TopUpMethod) => {
      setTopUpMethod(method);
      setTopUpMethodsVisible(false);
      armTopUpBackdrop(topUpBackdropSafeRef);
      setTopUpVisible(true);
    },
    [armTopUpBackdrop],
  );

  const openTopUpModal = useCallback(
    (initialSum?: string, options: TopUpModalOptions = {}) => {
      if (!user) {
        navigate('Login', undefined);
        return;
      }
      cashPaymentActionRef.current = options.onCashPayment ?? null;
      topUpSuccessActionRef.current = options.onTopUpSuccess ?? null;
      void (async () => {
        const fresh = await refreshUserData();
        // Свежий профиль + поля, которые не пришли в partial-ответе; при ошибке сети — last known user
        const profileUser =
          fresh != null && user != null
            ? ({...user, ...fresh} as User)
            : ((fresh ?? user) as User | null);
        if (profileUser && clientHasInvoiceLegalData(profileUser)) {
          setInvoiceStep('form');
          setQty19Str('');
          setQty12Str('');
          setPdfBase64(null);
          setPdfFileName(null);
          setInvoiceModalVisible(true);
          return;
        }
        if (initialSum !== undefined) {
          setTopUpSum(initialSum);
        } else {
          setTopUpSum('');
        }
        setTopUpOptions(options);
        armTopUpBackdrop(topUpMethodsBackdropSafeRef);
        setTopUpMethodsVisible(true);
      })();
    },
    [user, refreshUserData, armTopUpBackdrop],
  );

  const closeTopUpMethods = useCallback(() => {
    setTopUpMethodsVisible(false);
    cashPaymentActionRef.current = null;
    topUpSuccessActionRef.current = null;
  }, []);

  const handleCashPayment = useCallback(() => {
    const action = cashPaymentActionRef.current;
    closeTopUpMethods();
    action?.();
  }, [closeTopUpMethods]);

  const handleTopUpNewCard = useCallback(() => {
    const sum = topUpSum.trim();
    if (!sum || sum === '0' || isNaN(Number(sum))) {
      Alert.alert('Ошибка', 'Введите корректную сумму');
      return;
    }
    const amount = Number(sum);
    if (amount < 100) {
      Alert.alert('Ошибка', 'Минимальная сумма пополнения 100 ₸');
      return;
    }
    setTopUpVisible(false);
    setPaymentWebViewAmount(amount);
    setPaymentWebViewVisible(true);
  }, [topUpSum]);

  const handlePaymentWebViewClose = useCallback(
    (paymentCompleted: boolean) => {
      setPaymentWebViewVisible(false);
      setTopUpSum('');
      if (!paymentCompleted) return;
      void (async () => {
        const firstFresh = await refreshUserData();
        // Webhook Payplus может обновить баланс на CRM с задержкой — повторяем запрос
        await new Promise<void>(r => setTimeout(() => r(), 2000));
        const secondFresh = await refreshUserData();
        notifyTopUpSuccess((secondFresh ?? firstFresh ?? null) as User | null);
      })();
    },
    [refreshUserData, notifyTopUpSuccess],
  );

  const handleTopUpSavedCard = useCallback(() => {
    handleTopUpNewCard();
  }, [handleTopUpNewCard]);

  const handleTopUpKaspi = useCallback(async () => {
    const sum = topUpSum.trim();
    if (!sum || sum === '0' || isNaN(Number(sum))) {
      Alert.alert('Ошибка', 'Введите корректную сумму');
      return;
    }
    const amount = Number(sum);
    if (amount < 100) {
      Alert.alert('Ошибка', 'Минимальная сумма пополнения 100 ₸');
      return;
    }
    const clientId = getClientMongoId(user);
    if (!clientId) {
      Alert.alert('Ошибка', 'Не удалось определить клиента');
      return;
    }

    setTopUpSubmitting(true);
    try {
      const res = await apiService.createKaspiQrInvoice(
        amount,
        clientId,
        topUpOptions.pendingOrder,
      );
      const qrTokenUrl =
        typeof res?.invoice?.qrTokenUrl === 'string'
          ? res.invoice.qrTokenUrl.trim()
          : '';
      if (!res?.success || !qrTokenUrl) {
        Alert.alert(
          'Ошибка',
          res?.message || 'Не удалось создать ссылку для оплаты Kaspi',
        );
        return;
      }
      pendingKaspiInvoiceIdRef.current = String(res.invoice.id);
      kaspiStatusCheckAttemptsRef.current = 0;

      setTopUpVisible(false);
      setTopUpSum('');
      // iOS: canOpenURL для кастомных схем (kaspi://) часто даёт false без LSApplicationQueriesSchemes;
      // системный open чаще открывает ссылку успешнее, чем эта проверка.
      try {
        await Linking.openURL(qrTokenUrl);
      } catch (openErr) {
        console.warn('[TopUp Kaspi] Linking.openURL:', openErr);
        Alert.alert(
          'Ошибка',
          Platform.OS === 'ios'
            ? 'Не удалось открыть ссылку. Установите приложение Kaspi и попробуйте снова.'
            : 'Не удалось открыть ссылку оплаты',
        );
      }
    } catch {
      Alert.alert('Ошибка', 'Не удалось перейти к оплате через Kaspi');
    } finally {
      setTopUpSubmitting(false);
    }
  }, [topUpSum, user, topUpOptions.pendingOrder]);

  const checkPendingKaspiInvoice = useCallback(async () => {
    const invoiceId = pendingKaspiInvoiceIdRef.current;
    if (!invoiceId || kaspiStatusCheckingRef.current) return;

    kaspiStatusCheckingRef.current = true;
    try {
      const res = await apiService.getKaspiQrInvoice(invoiceId, true);
      const status = String(res?.invoice?.status || '').toLowerCase();
      if (status === 'paid') {
        pendingKaspiInvoiceIdRef.current = null;
        kaspiStatusCheckAttemptsRef.current = 0;
        const firstFresh = await refreshUserData();
        await new Promise<void>(r => setTimeout(() => r(), 2000));
        const secondFresh = await refreshUserData();
        notifyTopUpSuccess((secondFresh ?? firstFresh ?? null) as User | null);
      } else if (
        ['cancelled', 'expired', 'error', 'refunded'].includes(status)
      ) {
        pendingKaspiInvoiceIdRef.current = null;
        kaspiStatusCheckAttemptsRef.current = 0;
      } else if (
        ['pending', 'processing', ''].includes(status) &&
        kaspiStatusCheckAttemptsRef.current < 8
      ) {
        kaspiStatusCheckAttemptsRef.current += 1;
        setTimeout(() => {
          void checkPendingKaspiInvoice();
        }, 2500);
      }
    } finally {
      kaspiStatusCheckingRef.current = false;
    }
  }, [refreshUserData, notifyTopUpSuccess]);

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void checkPendingKaspiInvoice();
      }
    });
    return () => sub.remove();
  }, [checkPendingKaspiInvoice]);

  const showInvoice19 = user?.doesItTake19Bottles === true;
  const showInvoice12 = user?.doesItTake12Bottles === true;
  const hasAnyInvoiceBottleOption = showInvoice19 || showInvoice12;

  const handleGenerateInvoice = useCallback(async () => {
    if (!showInvoice19 && !showInvoice12) {
      Alert.alert(
        'Ошибка',
        'Для вашего профиля не указаны объёмы бутылей для счёта',
      );
      return;
    }
    const q19 = showInvoice19
      ? Math.max(0, Math.floor(Number(qty19Str.replace(',', '.') || '0')))
      : 0;
    const q12 = showInvoice12
      ? Math.max(0, Math.floor(Number(qty12Str.replace(',', '.') || '0')))
      : 0;
    if (q19 === 0 && q12 === 0) {
      Alert.alert('Ошибка', 'Укажите количество бутылей');
      return;
    }
    setInvoiceLoading(true);
    try {
      const fresh = await refreshUserData({silent: true});
      const profileUser =
        fresh != null && user != null
          ? ({...user, ...fresh} as User)
          : ((fresh ?? user) as User | null);
      const profileClientId = getClientMongoId(profileUser);
      if (!profileClientId) {
        Alert.alert(
          'Ошибка',
          'Не удалось загрузить профиль. Проверьте соединение и попробуйте снова.',
        );
        return;
      }
      const res = await apiService.generateInvoicePdf(
        profileClientId,
        q19,
        q12,
      );
      if (!res.success || !res.pdfBase64) {
        Alert.alert('Ошибка', res.message || 'Не удалось сформировать счёт');
        return;
      }
      setPdfBase64(res.pdfBase64);
      setPdfFileName(res.fileName || 'schet.pdf');
      setInvoiceStep('result');
      await refreshUserData();
    } finally {
      setInvoiceLoading(false);
    }
  }, [user, qty19Str, qty12Str, refreshUserData, showInvoice19, showInvoice12]);

  const handleSharePdf = useCallback(async () => {
    if (!pdfBase64 || !pdfFileName) return;
    try {
      const path = `${RNFS.CachesDirectoryPath}/${pdfFileName.replace(
        /[^\w.-]/g,
        '_',
      )}`;
      await RNFS.writeFile(path, normalizePdfBase64(pdfBase64), 'base64');
      const fileUrl = path.startsWith('file://') ? path : `file://${path}`;
      await Share.open({
        url: fileUrl,
        type: 'application/pdf',
        title: 'Счёт',
        subject: 'Счёт на оплату',
        failOnCancel: false,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg && !msg.includes('User did not share')) {
        Alert.alert('Ошибка', 'Не удалось поделиться файлом');
      }
    }
  }, [pdfBase64, pdfFileName]);

  const closePdfPreview = useCallback(() => {
    setPdfPreviewVisible(false);
    setPdfPreviewLocalUri(null);
    setPdfPreviewLoading(false);
    const p = pdfPreviewPathRef.current;
    pdfPreviewPathRef.current = null;
    if (p) {
      RNFS.unlink(p).catch(() => {});
    }
    if (Platform.OS === 'ios' && reopenInvoiceAfterPdfRef.current) {
      reopenInvoiceAfterPdfRef.current = false;
      setInvoiceModalVisible(true);
    }
  }, []);

  const openPdfPreview = useCallback(async () => {
    if (!pdfBase64) {
      Alert.alert('Ошибка', 'Нет данных PDF');
      return;
    }
    const prevPath = pdfPreviewPathRef.current;
    if (prevPath) {
      RNFS.unlink(prevPath).catch(() => {});
      pdfPreviewPathRef.current = null;
    }
    if (Platform.OS === 'ios') {
      reopenInvoiceAfterPdfRef.current = true;
      setInvoiceModalVisible(false);
      await new Promise<void>(resolve => {
        InteractionManager.runAfterInteractions(() => {
          setTimeout(() => resolve(), 320);
        });
      });
    }
    setPdfPreviewVisible(true);
    setPdfPreviewLoading(true);
    setPdfPreviewLocalUri(null);
    try {
      if (Platform.OS === 'ios') {
        // На iOS загрузка через data: → writeFile в react-native-blob-util внутри react-native-pdf
        // нередко даёт путь/файл, который PDFKit не открывает; RNFS + file:// совпадает с handleSharePdf.
        const safeName = (pdfFileName || 'preview.pdf').replace(
          /[^\w.-]/g,
          '_',
        );
        const path = `${
          RNFS.CachesDirectoryPath
        }/invoice_preview_${Date.now()}_${safeName}`;
        await RNFS.writeFile(path, normalizePdfBase64(pdfBase64), 'base64');
        pdfPreviewPathRef.current = path;
        setPdfPreviewLocalUri(
          path.startsWith('file://') ? path : `file://${path}`,
        );
      } else {
        pdfPreviewPathRef.current = null;
        setPdfPreviewLocalUri(pdfDataUri(pdfBase64));
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Ошибка', 'Не удалось подготовить PDF для просмотра');
      setPdfPreviewVisible(false);
      pdfPreviewPathRef.current = null;
      if (Platform.OS === 'ios' && reopenInvoiceAfterPdfRef.current) {
        reopenInvoiceAfterPdfRef.current = false;
        setInvoiceModalVisible(true);
      }
    } finally {
      setPdfPreviewLoading(false);
    }
  }, [pdfBase64, pdfFileName]);

  const closeInvoiceModal = useCallback(() => {
    setInvoiceModalVisible(false);
    setInvoiceStep('form');
    setPdfBase64(null);
    setPdfFileName(null);
    closePdfPreview();
  }, [closePdfPreview]);

  const value = useMemo(() => ({openTopUpModal}), [openTopUpModal]);

  return (
    <TopUpBalanceContext.Provider value={value}>
      {children}
      <PaymentWebView
        visible={paymentWebViewVisible}
        onClose={handlePaymentWebViewClose}
        amount={paymentWebViewAmount}
        userId={getClientMongoId(user)}
        userEmail={user?.mail}
        userPhone={user?.phone}
      />
      <Modal
        visible={topUpMethodsVisible}
        onRequestClose={closeTopUpMethods}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={Platform.OS === 'android'}>
        <TouchableOpacity
          style={styles.bottomSheetOverlay}
          activeOpacity={1}
          onPress={() => {
            if (topUpMethodsBackdropSafeRef.current) {
              closeTopUpMethods();
            }
          }}>
          <TouchableOpacity
            style={styles.bottomSheetContainer}
            activeOpacity={1}
            onPress={e => e.stopPropagation()}>
            <View style={styles.bottomSheetHandle} />
            {topUpOptions.showCashPayment ? (
              <View
                style={{
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingBottom: 16,
                }}>
                {/* <View style={{ flexShrink: 0 }}>
                                    <Image source={require('../assets/notEnough.png')} style={{ width: 20, height: 20 }} />
                                </View> */}
                <View style={{marginLeft: 16, maxWidth: '90%'}}>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: '500',
                      color: '#000',
                      textAlign: 'center',
                    }}>
                    Не хватает {topUpOptions.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '400',
                      color: '#4A5565',
                      textAlign: 'center',
                    }}>
                    Чтобы оформить заказ, пополните баланс на необходимую сумму.
                  </Text>
                </View>
              </View>
            ) : null}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#101828',
                  marginTop: 16,
                }}>
                Способы пополнения
              </Text>
            </View>
            <TouchableOpacity
              style={styles.bottomSheetPayBtn}
              onPress={() => openTopUpAmountSheet('kaspi')}>
              <View
                style={{
                  flexShrink: 0,
                  width: 48,
                  height: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 8,
                }}>
                <Image
                  source={require('../assets/kaspi.png')}
                  style={{width: 48, height: 48}}
                />
              </View>
              <View style={{marginLeft: 12, maxWidth: '65%'}}>
                <Text
                  style={{fontSize: 16, fontWeight: '500', color: '#101828'}}>
                  Пополнить через Kaspi
                </Text>
                <Text
                  style={{fontSize: 14, fontWeight: '400', color: '#4A5565'}}>
                  На сумму {topUpOptions.title}
                </Text>
              </View>
              <View
                style={{
                  flexShrink: 0,
                  width: 20,
                  height: 20,
                  marginLeft: 'auto',
                }}>
                <Image
                  source={require('../assets/arrowRight.png')}
                  style={{width: 20, height: 20}}
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bottomSheetPayBtn}
              onPress={() => openTopUpAmountSheet('card')}>
              <View
                style={{
                  flexShrink: 0,
                  width: 48,
                  height: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 8,
                  backgroundColor: '#EFF6FF',
                }}>
                <Image
                  source={require('../assets/card.png')}
                  style={{width: 24, height: 24}}
                />
              </View>
              <View style={{marginLeft: 12, maxWidth: '65%'}}>
                <Text
                  style={{fontSize: 16, fontWeight: '500', color: '#101828'}}>
                  Пополнить банковской картой
                </Text>
                <Text
                  style={{fontSize: 14, fontWeight: '400', color: '#4A5565'}}>
                  Visa · Mastercard · Apple Pay · Google Pay
                </Text>
              </View>
              <View
                style={{
                  flexShrink: 0,
                  width: 20,
                  height: 20,
                  marginLeft: 'auto',
                }}>
                <Image
                  source={require('../assets/arrowRight.png')}
                  style={{width: 20, height: 20}}
                />
              </View>
            </TouchableOpacity>
            {topUpOptions.showCashPayment ? (
              <TouchableOpacity
                style={styles.bottomSheetPayBtn}
                onPress={handleCashPayment}>
                <View
                  style={{
                    flexShrink: 0,
                    width: 48,
                    height: 48,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 8,
                    backgroundColor: '#F0FDF4',
                  }}>
                  <Image
                    source={require('../assets/fakt.png')}
                    style={{width: 24, height: 24}}
                  />
                </View>
                <View style={{marginLeft: 12, maxWidth: '65%'}}>
                  <Text
                    style={{fontSize: 16, fontWeight: '500', color: '#101828'}}>
                    Оплата курьеру
                  </Text>
                  <Text
                    style={{fontSize: 14, fontWeight: '400', color: '#4A5565'}}>
                    QR или наличными
                  </Text>
                </View>
                <View
                  style={{
                    flexShrink: 0,
                    width: 20,
                    height: 20,
                    marginLeft: 'auto',
                  }}>
                  <Image
                    source={require('../assets/arrowRight.png')}
                    style={{width: 20, height: 20}}
                  />
                </View>
              </TouchableOpacity>
            ) : null}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 16,
              }}>
              <Image
                source={require('../assets/guard.png')}
                style={{width: 20, height: 20}}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: '#0D542B',
                  marginLeft: 8,
                }}>
                Безопасно и конфиденциально
              </Text>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <Modal
        visible={invoiceModalVisible}
        onRequestClose={closeInvoiceModal}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={Platform.OS === 'android'}
        presentationStyle={
          Platform.OS === 'ios' ? 'overFullScreen' : undefined
        }>
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity
            style={styles.bottomSheetOverlay}
            activeOpacity={1}
            onPress={closeInvoiceModal}>
            <Pressable
              style={styles.bottomSheetContainer}
              onPress={() => undefined}
              collapsable={false}>
              <View style={styles.bottomSheetHandle} />
              <Text style={styles.bottomSheetTitle}>Оформление счета</Text>

              <>
                <Text style={styles.invoiceSubtitle}>
                  Чтобы заказать воду, пополните ваш баланс. Создайте документ
                  для оплаты через банк.
                </Text>
                {!hasAnyInvoiceBottleOption ? (
                  <Text style={styles.invoiceHint}>
                    Для оформления счёта в профиле не указаны объёмы бутылей (19
                    л / 12 л). Обратитесь к менеджеру.
                  </Text>
                ) : (
                  <>
                    {showInvoice19 ? (
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 12,
                        }}>
                        <TextInput
                          style={[
                            styles.bottomSheetInput,
                            {flex: 1, marginBottom: 0},
                          ]}
                          value={qty19Str}
                          onChangeText={value => {
                            setInvoiceStep('form');
                            setQty19Str(value);
                          }}
                          placeholder="Количество 19 л"
                          keyboardType="numeric"
                          placeholderTextColor="#99A3B3"
                        />
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: '500',
                            color: '#000000',
                            marginRight: 12,
                            marginLeft: 8,
                          }}>
                          {user?.price19
                            ? (
                                user.price19 *
                                (Number(String(qty19Str).replace(',', '.')) ||
                                  0)
                              ).toLocaleString('ru-RU')
                            : 0}{' '}
                          ₸
                        </Text>
                      </View>
                    ) : null}

                    {showInvoice12 ? (
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 12,
                        }}>
                        <TextInput
                          style={[
                            styles.bottomSheetInput,
                            {flex: 1, marginBottom: 0},
                          ]}
                          value={qty12Str}
                          onChangeText={value => {
                            setInvoiceStep('form');
                            setQty12Str(value);
                          }}
                          placeholder="Количество 12 л"
                          keyboardType="numeric"
                          placeholderTextColor="#99A3B3"
                        />
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: '500',
                            color: '#000000',
                            marginRight: 12,
                            marginLeft: 8,
                          }}>
                          {user?.price12
                            ? (
                                user.price12 *
                                (Number(String(qty12Str).replace(',', '.')) ||
                                  0)
                              ).toLocaleString('ru-RU')
                            : 0}{' '}
                          ₸
                        </Text>
                      </View>
                    ) : null}

                    <View
                      style={{
                        height: 1,
                        width: '100%',
                        backgroundColor: '#E3E3E3',
                      }}
                    />

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                      <View
                        style={{
                          backgroundColor: '#ebeaf0',
                          padding: 12,
                          borderRadius: 12,
                          marginTop: 12,
                          width: '85%',
                        }}>
                        <Text
                          style={{
                            fontSize: 12,
                            color: '#000000',
                            textAlign: 'center',
                          }}>
                          Нажмите на число в поле, если нужно ввести другое
                          количество воды
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 12,
                        marginBottom: 12,
                      }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '500',
                          color: '#000000',
                        }}>
                        Итого:
                      </Text>
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: '500',
                          color: '#000000',
                        }}>
                        {(
                          (showInvoice19 && user?.price19
                            ? user.price19 *
                              (Number(String(qty19Str).replace(',', '.')) || 0)
                            : 0) +
                          (showInvoice12 && user?.price12
                            ? user.price12 *
                              (Number(String(qty12Str).replace(',', '.')) || 0)
                            : 0)
                        ).toLocaleString('ru-RU')}{' '}
                        ₸
                      </Text>
                    </View>
                  </>
                )}
                {invoiceStep === 'form' ? (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.invoiceReadyBtn,
                        (invoiceLoading || !hasAnyInvoiceBottleOption) && {
                          opacity: 0.5,
                        },
                      ]}
                      onPress={handleGenerateInvoice}
                      disabled={invoiceLoading || !hasAnyInvoiceBottleOption}>
                      {invoiceLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.invoiceReadyBtnText}>
                          Сформировать счёт
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.invoiceResultRow}>
                      <TouchableOpacity
                        style={styles.invoicePdfWideBtn}
                        onPress={openPdfPreview}
                        activeOpacity={0.85}>
                        <Text style={styles.invoicePdfWideBtnText}>
                          ПОСМОТРЕТЬ СЧЕТ (PDF)
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.invoiceShareSquareBtn}
                        onPress={handleSharePdf}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel="Поделиться счётом">
                        <ShareGlyph color="#333" />
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </>
            </Pressable>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={pdfPreviewVisible}
        onRequestClose={closePdfPreview}
        animationType="fade"
        presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
        statusBarTranslucent={Platform.OS === 'android'}>
        <View style={styles.pdfModalRoot}>
          <View style={styles.pdfToolbar}>
            <TouchableOpacity
              onPress={closePdfPreview}
              style={styles.pdfCloseBtn}>
              <Text style={styles.pdfCloseText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
          {pdfPreviewLoading ? (
            <View style={styles.pdfLoadingWrap}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : pdfPreviewLocalUri ? (
            <Pdf
              source={{uri: pdfPreviewLocalUri}}
              style={styles.pdfViewer}
              fitPolicy={0}
              enablePaging={false}
              onError={err => {
                console.warn('Pdf onError', err);
                Alert.alert('Ошибка', 'Не удалось отобразить PDF');
              }}
            />
          ) : (
            <View style={styles.pdfLoadingWrap}>
              <Text style={styles.pdfEmptyText}>Нет файла</Text>
            </View>
          )}
        </View>
      </Modal>
      <Modal
        visible={topUpVisible}
        onRequestClose={() => setTopUpVisible(false)}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={Platform.OS === 'android'}>
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity
            style={styles.bottomSheetOverlay}
            activeOpacity={1}
            onPress={() => {
              if (topUpBackdropSafeRef.current) {
                setTopUpVisible(false);
              }
            }}>
            <TouchableOpacity
              style={styles.bottomSheetContainer}
              activeOpacity={1}
              onPress={e => e.stopPropagation()}>
              <View style={styles.bottomSheetHandle} />
              <Text style={styles.bottomSheetTitle}>
                {topUpMethod === 'kaspi'
                  ? 'Пополнение через Kaspi'
                  : 'Пополнение банковской картой'}
              </Text>

              <View style={styles.bottomSheetBalanceRow}>
                <Text style={styles.bottomSheetBalanceLabel}>
                  Текущий баланс:
                </Text>
                <Text style={styles.bottomSheetBalanceValue}>
                  {Number(user?.balance || 0).toLocaleString('ru-RU')} ₸
                </Text>
              </View>

              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#E3E3E3',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: '#101010',
                  backgroundColor: '#F8F8F8',
                  marginBottom: 16,
                }}
                value={topUpSum}
                onChangeText={setTopUpSum}
                placeholder="Сумма пополнения"
                keyboardType="numeric"
                placeholderTextColor="#99A3B3"
              />

              <View style={styles.bottomSheetQuickAmounts}>
                {[3000, 5000, 10000].map(amount => (
                  <TouchableOpacity
                    key={amount}
                    onPress={() => setTopUpSum(amount.toString())}
                    style={[
                      styles.bottomSheetQuickBtn,
                      topUpSum === amount.toString() &&
                        styles.bottomSheetQuickBtnActive,
                    ]}>
                    <Text
                      style={[
                        styles.bottomSheetQuickBtnText,
                        topUpSum === amount.toString() &&
                          styles.bottomSheetQuickBtnTextActive,
                      ]}>
                      {amount.toLocaleString('ru-RU')} ₸
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#DC1818',
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginBottom: 10,
                }}
                disabled={topUpSubmitting}
                onPress={() => {
                  if (topUpMethod === 'kaspi') {
                    handleTopUpKaspi();
                  } else {
                    handleTopUpSavedCard();
                  }
                }}>
                {topUpSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.bottomSheetPayBtnText}>Продолжить</Text>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </TopUpBalanceContext.Provider>
  );
};

const styles = StyleSheet.create({
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    height: 'max-content' as unknown as number,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E3E3E3',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  bottomSheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#101010',
    textAlign: 'center',
    marginBottom: 16,
  },
  invoiceSubtitle: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  invoiceHint: {
    fontSize: 14,
    color: '#444',
    marginBottom: 12,
    lineHeight: 20,
  },
  topUpMethodsSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#101010',
    textAlign: 'center',
    marginBottom: 16,
  },
  invoiceReadyBtn: {
    backgroundColor: '#DC1818',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  invoiceReadyBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  invoiceResultRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 4,
  },
  invoicePdfWideBtn: {
    flex: 1,
    minHeight: 52,
    backgroundColor: '#DC1818',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginRight: 10,
  },
  invoicePdfWideBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  invoiceShareSquareBtn: {
    width: 52,
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEDBDB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  bottomSheetBalanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  bottomSheetBalanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC1818',
  },
  bottomSheetInput: {
    borderWidth: 1,
    borderColor: '#E3E3E3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#101010',
    flexBasis: '70%',
    backgroundColor: '#F8F8F8',
  },
  bottomSheetQuickAmounts: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  bottomSheetQuickBtn: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E3E3E3',
  },
  bottomSheetQuickBtnActive: {
    backgroundColor: '#DC1818',
    borderColor: '#DC1818',
  },
  bottomSheetQuickBtnText: {
    color: '#111',
    fontWeight: '600',
    fontSize: 14,
  },
  bottomSheetQuickBtnTextActive: {
    color: '#fff',
  },
  bottomSheetPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    backgroundColor: 'white',
  },
  bottomSheetPayBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSheetSecondaryBtn: {
    backgroundColor: '#0d74d0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  bottomSheetSecondaryBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSheetNewCardBtn: {
    borderWidth: 1,
    borderColor: '#DC1818',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  bottomSheetNewCardBtnText: {
    color: '#DC1818',
    fontSize: 15,
    fontWeight: '600',
  },
  bottomSheetCashBtn: {
    backgroundColor: '#101010',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  bottomSheetCashBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pdfModalRoot: {
    flex: 1,
    backgroundColor: '#333',
  },
  pdfToolbar: {
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#222',
  },
  pdfCloseBtn: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  pdfCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pdfViewer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#525659',
  },
  pdfLoadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  pdfEmptyText: {
    color: '#aaa',
    fontSize: 16,
  },
});
