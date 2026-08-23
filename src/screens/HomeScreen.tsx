import React, {useEffect, useState, useCallback, useMemo, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  DeviceEventEmitter,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
  Animated,
  Share,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {androidOnlySafeAreaEdges} from '../utils/safeArea';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Header from '../components/Header';
import MainPageBanner from '../components/MainPageBanner';
import Products from '../components/Products';
import SpecialOffer from '../components/SpecialOffer';
import OrderBlock from '../components/OrderBlock';
import MainOrderCard from '../components/MainOrderCard';
import UsefulServices from '../components/UsefulServices';
import {RootStackParamList, OrderAddress, OrderData} from '../types/navigation';
import type {CreateOrderPayload} from '../components/MainOrderCard';
import {useAuth} from '../hooks/useAuth';
import {apiService} from '../api/services';
const {tokenStorage} = require('../utils/storage');
import {useFocusEffect} from '@react-navigation/native';
import {useTopUpBalance} from '../context/TopUpBalanceContext';
import {clientHasInvoiceLegalData} from '../utils/clientInvoiceProfile';
import {getClientMongoId} from '../utils/clientId';
import {getWalletOpFormForUser} from '../utils/invoiceClientOrderPayment';
import {resolveRepeatOrderAddress} from '../utils/orderAddress';
import ReferralPromoModal from '../components/ReferralPromoModal';
import {buildReferralShareMessage} from '../utils/referral';
import {
  computeNextDeliveryYmd,
  buildSelectableDeliveryDates,
  getDeliveryAcceptTextFromYmd,
} from '../utils/orderDeliveryDate';
import {logOrderPurchaseEvents} from '../utils/facebookEvents';

/** Скелетон блока «Повторить последний заказ» — те же размеры/отступы, что и у самого блока, чтобы контент под ним не прыгал во время загрузки. */
const RepeatOrderSkeleton: React.FC<{roundedBottom: boolean}> = ({
  roundedBottom,
}) => {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        ...(roundedBottom
          ? {borderBottomLeftRadius: 16, borderBottomRightRadius: 16}
          : {}),
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}>
      <View
        style={{
          flexDirection: 'row',
          maxWidth: '50%',
          alignItems: 'center',
          gap: 8,
        }}>
        <Animated.View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: '#E3E3E3',
            opacity: pulse,
          }}
        />
        <View style={{gap: 6}}>
          <Animated.View
            style={{
              width: 140,
              height: 12,
              borderRadius: 6,
              backgroundColor: '#E3E3E3',
              opacity: pulse,
            }}
          />
          <Animated.View
            style={{
              width: 100,
              height: 10,
              borderRadius: 5,
              backgroundColor: '#E3E3E3',
              opacity: pulse,
            }}
          />
          <Animated.View
            style={{
              width: 80,
              height: 10,
              borderRadius: 5,
              backgroundColor: '#E3E3E3',
              opacity: pulse,
              marginTop: 4,
            }}
          />
        </View>
      </View>
      <Animated.View
        style={{
          width: 70,
          height: 24,
          borderRadius: 10,
          backgroundColor: '#E3E3E3',
          opacity: pulse,
        }}
      />
    </View>
  );
};

const HomeScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {user, loadingState, refreshUserData, updateUser} = useAuth();
  const {openTopUpModal} = useTopUpBalance();
  /**
   * refreshUserData() кладёт в user новый объект при каждом обновлении, даже если данные
   * не изменились. Эффекты ниже должны реагировать на смену клиента (логин/логаут/другой
   * аккаунт), а не на каждую пересборку объекта — иначе useFocusEffect/useEffect с [user]
   * триггерят друг друга по кругу (refreshUserData → новый user → эффект → refreshUserData → ...),
   * из-за чего скелетон и блок повтора заказа бесконечно мигают.
   */
  const clientId = getClientMongoId(user);
  const [token, setToken] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [lastOrderLoading, setLastOrderLoading] = useState(true);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [notEnoughBalanceModalVisible, setNotEnoughBalanceModalVisible] =
    useState(false);
  const [masterCallConfirmModalVisible, setMasterCallConfirmModalVisible] =
    useState(false);
  const [masterCallSuccessModalVisible, setMasterCallSuccessModalVisible] =
    useState(false);
  const [masterCallLoading, setMasterCallLoading] = useState(false);
  const [referralPromoVisible, setReferralPromoVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [firstOrderModalVisible, setFirstOrderModalVisible] = useState(false);
  const [pendingFirstOrder, setPendingFirstOrder] =
    useState<CreateOrderPayload | null>(null);
  const [firstOrderSubmitting, setFirstOrderSubmitting] = useState(false);
  /** Заказ, собранный вручную через «Изменить» на карточке повтора — в отличие от
   * pendingFirstOrder, идёт через полный флоу (выбор даты + способа оплаты, включая наличные). */
  const [pendingCustomOrder, setPendingCustomOrder] =
    useState<CreateOrderPayload | null>(null);
  const [repeatDateModalVisible, setRepeatDateModalVisible] = useState(false);
  const [repeatAvailableDates, setRepeatAvailableDates] = useState<
    {value: string; label: string}[]
  >([]);

  const platformSentClientIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  /** Дата доставки, выбранная в модалке «Повторить последний заказ». */
  const repeatOrderDeliveryYmdRef = useRef<string | null>(null);

  useEffect(() => {
    tokenStorage.getAuthToken().then((token: any) => {
      setToken(token);
    });
  }, []);

  useEffect(() => {
    if (clientId && platformSentClientIdRef.current !== clientId) {
      platformSentClientIdRef.current = clientId;
      apiService.updateData(clientId, 'platform', Platform.OS);
      const APP_VERSION = '1.7.0';
      apiService.updateData(clientId, 'appVersion', APP_VERSION.toString());
    }
  }, [clientId]);

  // Очистка заказов при выходе из системы
  useFocusEffect(
    useCallback(() => {
      if (!clientId) {
        console.log('Пользователь вышел из системы - очищаем заказы');
        setOrders([]);
        setLastOrder(null);
        setLastOrderLoading(false);
        setSelectedPayment(null);
        setPaymentModalVisible(false);
        setNotEnoughBalanceModalVisible(false);
        setRepeatDateModalVisible(false);
        repeatOrderDeliveryYmdRef.current = null;
      }
    }, [clientId]),
  );

  useEffect(() => {
    currentUserIdRef.current = clientId || null;
    setOrders([]);
    setLastOrder(null);
    setLastOrderLoading(!!clientId);
    setSelectedPayment(null);
    setPaymentModalVisible(false);
    setNotEnoughBalanceModalVisible(false);
    setRepeatDateModalVisible(false);
    repeatOrderDeliveryYmdRef.current = null;
  }, [clientId]);

  useFocusEffect(
    useCallback(() => {
      // Запрашиваем активные заказы каждый раз при переходе на экран
      if (clientId) {
        getLastOrder(clientId);
        refreshUserData();
        apiService
          .getActiveOrders(clientId)
          .then((res: any) => {
            if (currentUserIdRef.current !== clientId) {
              return;
            }
            setOrders(res.orders);
          })
          .catch(error => {
            console.error('Ошибка при получении активных заказов:', error);
          });
      }
    }, [clientId, refreshUserData]),
  );

  const getLastOrder = useCallback(
    async (clientIdOverride?: string) => {
      const clientId = clientIdOverride ?? getClientMongoId(user);
      if (clientId) {
        setLastOrderLoading(true);
        try {
          const lastOrder = await apiService.getLastOrder(clientId);
          if (currentUserIdRef.current !== clientId) {
            return;
          }
          console.log('lastOrder', lastOrder);
          if (lastOrder.success) {
            setLastOrder(lastOrder.order);
          } else {
            setLastOrder(null);
          }
        } finally {
          if (currentUserIdRef.current === clientId) {
            setLastOrderLoading(false);
          }
        }
      } else {
        setLastOrderLoading(false);
      }
    },
    [user],
  );

  /** Порядковый номер запроса getActiveOrders — если более старый ответ приходит
   * после более нового (или после live-обновления статуса из пуша), он отбрасывается,
   * а не перезаписывает свежее состояние устаревшими данными. */
  const activeOrdersRequestIdRef = useRef(0);

  const fetchActiveOrders = useCallback(
    async (clientIdOverride?: string) => {
      const targetClientId = clientIdOverride ?? clientId;
      if (!targetClientId) return;
      const requestId = ++activeOrdersRequestIdRef.current;
      try {
        const res = await apiService.getActiveOrders(targetClientId);
        if (
          currentUserIdRef.current !== targetClientId ||
          activeOrdersRequestIdRef.current !== requestId
        ) {
          return;
        }
        if (res?.orders) {
          setOrders(res.orders);
        }
      } catch (error) {
        console.error('Ошибка при получении активных заказов:', error);
      }
    },
    [clientId],
  );

  const openMasterCallConfirmModal = () => {
    if (!user || !getClientMongoId(user)) {
      Alert.alert('Вход в аккаунт', 'Войдите в аккаунт, чтобы вызвать мастера');
      return;
    }
    const fullName =
      user.userName?.trim() ||
      (user as {fullName?: string}).fullName?.trim() ||
      '';
    const phone = user.phone?.trim() || '';
    if (!fullName || !phone) {
      Alert.alert(
        'Данные профиля',
        'Укажите имя и телефон в разделе «Мои данные».',
        [
          {text: 'Отмена', style: 'cancel'},
          {text: 'Перейти', onPress: () => navigation.navigate('ChangeData')},
        ],
      );
      return;
    }
    setMasterCallConfirmModalVisible(true);
  };

  const handleInvitePress = async () => {
    let code = user?.referralCode;
    const clientId = getClientMongoId(user);
    if (!code && clientId) {
      try {
        const res = await apiService.getData(clientId);
        code = res.client?.referralCode;
        if (res.client) {
          await refreshUserData();
        }
      } catch {
        Alert.alert('Ошибка', 'Не удалось загрузить реферальный код');
        return;
      }
    }
    if (!code) {
      Alert.alert('Код недоступен', 'Попробуйте позже');
      return;
    }
    const msg = buildReferralShareMessage(code);
    try {
      await Share.share(
        Platform.OS === 'ios'
          ? {message: msg}
          : {message: msg, title: 'Тибетская вода'},
      );
    } catch {
      /* отмена шеринга */
    }
  };

  const handleRequestMasterCall = async () => {
    if (!user || !getClientMongoId(user)) {
      Alert.alert('Вход в аккаунт', 'Войдите в аккаунт, чтобы вызвать мастера');
      return;
    }
    const fullName =
      user.userName?.trim() ||
      (user as {fullName?: string}).fullName?.trim() ||
      '';
    const phone = user.phone?.trim() || '';
    if (!fullName || !phone) {
      setMasterCallConfirmModalVisible(false);
      Alert.alert(
        'Данные профиля',
        'Укажите имя и телефон в разделе «Мои данные».',
        [
          {text: 'Отмена', style: 'cancel'},
          {text: 'Перейти', onPress: () => navigation.navigate('ChangeData')},
        ],
      );
      return;
    }
    setMasterCallLoading(true);
    try {
      const res = await apiService.requestMasterCall({
        fullName,
        phone,
        mail: user?.mail || '',
      });
      if (res?.success) {
        setMasterCallConfirmModalVisible(false);
        setMasterCallSuccessModalVisible(true);
      } else {
        Alert.alert(
          'Ошибка',
          (res as {message?: string})?.message || 'Не удалось отправить заявку',
        );
      }
    } catch {
      Alert.alert('Ошибка', 'Не удалось отправить заявку');
    } finally {
      setMasterCallLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (getClientMongoId(user) && loadingState === 'success') {
        refreshUserData();
      }
    }, [refreshUserData]),
  );

  // Подписка на обновления статусов заказов
  useEffect(() => {
    let isMounted = true;

    const subscription = DeviceEventEmitter.addListener(
      'orderStatusUpdated',
      async ({orderId, newStatus}) => {
        // Проверяем, что компонент все еще смонтирован
        if (!isMounted) {
          return;
        }

        // Проверяем наличие обязательных данных
        if (!orderId || !newStatus) {
          console.warn('⚠️ HomeScreen: Неполные данные обновления заказа:', {
            orderId,
            newStatus,
          });
          return;
        }

        const fetchOrder = async () => {
          const orderData = await apiService.getOrder(orderId);
          return orderData.order;
        };
        const orderData = await fetchOrder();
        if (!orderData) {
          console.warn(
            '⚠️ HomeScreen: Не удалось получить данные заказа:',
            orderId,
          );
          return;
        }

        // Обновляем состояние заказов
        setOrders(prevOrders => {
          // Защита от null/undefined
          if (!prevOrders || !Array.isArray(prevOrders)) {
            console.warn('⚠️ HomeScreen: prevOrders не является массивом');
            return orderData ? [orderData] : [];
          }

          const orderExists = prevOrders.some(
            order => order && order._id === orderId,
          );

          if (orderExists) {
            // Обновляем существующий заказ
            return prevOrders.map(order => {
              if (!order) return order;
              return order._id === orderId
                ? {
                    ...order,
                    courierAggregator: orderData?.courierAggregator,
                    status: newStatus,
                    updatedAt: orderData?.updatedAt || new Date().toISOString(),
                  }
                : order;
            });
          } else {
            // Добавляем новый заказ в начало списка
            return orderData ? [orderData, ...prevOrders] : prevOrders;
          }
        });

        // lastOrder приходит из отдельного запроса (getLastOrder) и не синхронизируется
        // автоматически с обновлением orders выше — без этого «Доставлен»/«Отменён»
        // не отобразятся на MainOrderCard, пока экран не потеряет и не вернёт фокус.
        setLastOrder((prevLastOrder: OrderData | null) =>
          prevLastOrder && prevLastOrder._id === orderId
            ? {
                ...prevLastOrder,
                courierAggregator: orderData?.courierAggregator,
                status: newStatus,
                updatedAt: orderData?.updatedAt || new Date().toISOString(),
              }
            : prevLastOrder,
        );
      },
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  const getNextDeliveryYmd = () => computeNextDeliveryYmd(user ?? null);

  /**
   * Черновик повторного заказа для сервера: если клиент уйдёт оплачивать Kaspi QR
   * и не вернётся в приложение, сервер создаст этот заказ сам после зачисления баланса.
   */
  const buildPendingOrderDraft = (opForm: string, deliveryYmd: string) => {
    const clientId = getClientMongoId(user);
    if (!clientId || !lastOrder) return undefined;
    return {
      clientId,
      address: resolveRepeatOrderAddress(user, lastOrder.address),
      products: lastOrder.products,
      clientNotes: [],
      date: {d: deliveryYmd, time: ''},
      opForm,
      needCall: true,
      comment: '',
    };
  };

  const reloadOrder = async (
    paymentOverride?: string,
    options?: {
      deliveryYmd?: string | null;
      skipBalanceCheck?: boolean;
    },
  ) => {
    const paymentValue = paymentOverride ?? selectedPayment?.value;
    const skipBal = options?.skipBalanceCheck ?? false;
    const resolvedYmd =
      (options?.deliveryYmd ?? repeatOrderDeliveryYmdRef.current) ||
      getNextDeliveryYmd();
    const clientId = getClientMongoId(user);
    /** Заказ «Повторить» использует lastOrder как есть; заказ, собранный через
     * «Изменить» (pendingCustomOrder), подставляет вручную выбранные количества. */
    const orderProducts = pendingCustomOrder
      ? {b12: pendingCustomOrder.quantity12, b19: pendingCustomOrder.quantity19}
      : lastOrder?.products;
    const orderSum = pendingCustomOrder
      ? pendingCustomOrder.total
      : lastOrder?.sum;
    const orderAddress = pendingCustomOrder
      ? homeAddress
      : lastOrder && resolveRepeatOrderAddress(user, lastOrder.address);
    /** Повтор заказа не переспрашивает про тару — там новой тары нет, как и раньше. */
    const orderEmptyBottles = pendingCustomOrder
      ? getEmptyBottlesForBackend(pendingCustomOrder)
      : undefined;
    const buildDraft = (opForm: string, ymd: string) =>
      pendingCustomOrder
        ? buildFirstOrderPendingDraft(pendingCustomOrder, ymd, opForm)
        : buildPendingOrderDraft(opForm, ymd);

    if (user && clientId && lastOrder && orderProducts && orderAddress) {
      if (
        !skipBal &&
        (paymentValue === 'credit' || paymentValue === 'coupon')
      ) {
        if (user?.paymentMethod === 'balance') {
          if (
            paymentValue === 'credit' &&
            user?.balance !== undefined &&
            user.balance < orderSum
          ) {
            setPaymentModalVisible(false);
            const deficit = Math.max(0, Math.ceil(orderSum - user.balance));
            const afterTopUp = () => {
              const ymd = repeatOrderDeliveryYmdRef.current;
              if (!ymd || !clientId || !lastOrder) return;
              void reloadOrder('credit', {
                deliveryYmd: ymd,
                skipBalanceCheck: true,
              });
            };
            if (clientHasInvoiceLegalData(user)) {
              void openTopUpModal(String(deficit), {
                onTopUpSuccess: afterTopUp,
                pendingOrder: buildDraft('credit', resolvedYmd),
              });
            } else {
              void openTopUpModal(String(deficit), {
                title: `Не хватает ${deficit.toLocaleString('ru-RU')} ₸`,
                subtitle: 'Способы пополнения',
                showCashPayment: true,
                onCashPayment: () =>
                  void reloadOrder('fakt', {deliveryYmd: resolvedYmd}),
                onTopUpSuccess: afterTopUp,
                pendingOrder: buildDraft('credit', resolvedYmd),
              });
            }
            return;
          }
        } else if (user?.paymentMethod === 'coupon') {
          const needed19 = orderProducts?.b19 || 0;
          const needed12 = orderProducts?.b12 || 0;
          if (
            paymentValue === 'coupon' &&
            (needed19 > (user?.paidBootlesFor19 || 0) ||
              needed12 > (user?.paidBootlesFor12 || 0))
          ) {
            setPaymentModalVisible(false);
            const afterTopUpCoupon = () => {
              const ymd = repeatOrderDeliveryYmdRef.current;
              if (!ymd || !clientId || !lastOrder) return;
              void reloadOrder('coupon', {
                deliveryYmd: ymd,
                skipBalanceCheck: true,
              });
            };
            if (clientHasInvoiceLegalData(user)) {
              void openTopUpModal(undefined, {
                onTopUpSuccess: afterTopUpCoupon,
                pendingOrder: buildDraft('coupon', resolvedYmd),
              });
            } else {
              setNotEnoughBalanceModalVisible(true);
            }
            return;
          }
        }
      }

      const orderDateObject = {d: resolvedYmd, time: ''};
      let res: any;
      try {
        res = await apiService.addOrder(
          clientId,
          orderAddress,
          orderProducts,
          [],
          orderDateObject,
          paymentValue,
          true,
          '',
          orderEmptyBottles,
        );
      } catch (error: any) {
        const message = error?.response?.data?.message;
        if (message === 'Недостаточно средств на балансе') {
          setPaymentModalVisible(false);
          const deficit = Math.max(
            0,
            Math.ceil(orderSum - Number(user.balance || 0)),
          );
          const afterTopUp = () => {
            const ymd = repeatOrderDeliveryYmdRef.current;
            if (!ymd || !clientId || !lastOrder) return;
            void reloadOrder('credit', {
              deliveryYmd: ymd,
              skipBalanceCheck: true,
            });
          };
          if (clientHasInvoiceLegalData(user)) {
            void openTopUpModal(String(deficit), {
              onTopUpSuccess: afterTopUp,
              pendingOrder: buildDraft('credit', resolvedYmd),
            });
          } else {
            void openTopUpModal(String(deficit), {
              title: `Не хватает ${deficit.toLocaleString('ru-RU')} ₸`,
              subtitle: 'Способы пополнения',
              showCashPayment: true,
              onCashPayment: () =>
                void reloadOrder('fakt', {deliveryYmd: resolvedYmd}),
              onTopUpSuccess: afterTopUp,
              pendingOrder: buildDraft('credit', resolvedYmd),
            });
          }
        } else {
          Alert.alert('Ошибка', message || 'Не удалось оформить заказ');
        }
        return;
      }
      // "Заказ на эту дату уже существует" — сервер мог уже создать этот заказ сам
      // (автосоздание после пополнения баланса через Kaspi), это не ошибка.
      const alreadyCreatedByServer =
        !res.success && res.message === 'Заказ на эту дату уже существует';
      try {
        if (res.success || alreadyCreatedByServer) {
          repeatOrderDeliveryYmdRef.current = null;
          const showRef = Boolean(
            (res as {showReferralModal?: boolean}).showReferralModal,
          );
          logOrderPurchaseEvents({
            user,
            products: orderProducts,
            totalAmount: orderSum,
            orderId: (res as {order?: {_id?: string}}).order?._id,
          });
          setPaymentModalVisible(false);
          setNotEnoughBalanceModalVisible(false);
          setPendingCustomOrder(null);

          const syncUserAndOrders = async () => {
            try {
              await refreshUserData();
              await getLastOrder();
              if (clientId) {
                const activeRes = await apiService.getActiveOrders(clientId);
                if (activeRes?.orders) {
                  setOrders(activeRes.orders);
                }
              }
            } catch (e) {
              console.error('Ошибка обновления после заказа:', e);
            }
          };

          void syncUserAndOrders();

          const alertText = getDeliveryAcceptTextFromYmd(resolvedYmd);
          Alert.alert('Успешно', alertText, [
            {
              text: 'OK',
              onPress: () => {
                void syncUserAndOrders();
                if (showRef) {
                  setReferralPromoVisible(true);
                }
              },
            },
          ]);
        } else {
          Alert.alert('Ошибка', res.message);
        }
      } catch (postError) {
        // Заказ на сервере уже создан (res.success истинен) — эта ошибка только
        // в пост-обработке (аналитика/обновление данных), нельзя дать ей уронить приложение.
        console.error('Ошибка после оформления заказа:', postError);
        setPaymentModalVisible(false);
        setNotEnoughBalanceModalVisible(false);
        setPendingCustomOrder(null);
      }
    }
  };

  /** Повтор последнего заказа: 1) дата 2) кошелёк или пополнение. */
  const startRepeatLastOrderFlow = () => {
    if (!user || !lastOrder) return;
    repeatOrderDeliveryYmdRef.current = null;
    setPendingCustomOrder(null);
    setRepeatAvailableDates(buildSelectableDeliveryDates(user ?? null));
    setRepeatDateModalVisible(true);
  };

  const onRepeatDateSelectedFromModal = (deliveryYmd: string) => {
    setRepeatDateModalVisible(false);
    if (!user || !getClientMongoId(user)) return;

    repeatOrderDeliveryYmdRef.current = deliveryYmd;

    // Первый заказ клиента без истории — дата выбрана, дальше подтверждение оплаты с баланса.
    if (pendingFirstOrder) {
      setFirstOrderModalVisible(true);
      return;
    }

    if (!lastOrder) return;

    // Заказ, собранный вручную через «Изменить», всегда даёт явный выбор способа
    // оплаты (включая наличные) — без автосписания с баланса.
    if (pendingCustomOrder) {
      setSelectedPayment(null);
      setPaymentModalVisible(true);
      return;
    }

    const walletOp = getWalletOpFormForUser(user);

    const needed19 = Number(lastOrder?.products?.b19 || 0);
    const needed12 = Number(lastOrder?.products?.b12 || 0);
    const available19 = Number(user?.paidBootlesFor19 || 0);
    const available12 = Number(user?.paidBootlesFor12 || 0);

    const orderSumMoney =
      typeof lastOrder.sum === 'number' && Number.isFinite(lastOrder.sum)
        ? lastOrder.sum
        : needed19 * Number(user.price19 || 0) +
          needed12 * Number(user.price12 || 0);

    // Кошелёк: баланс в тенге
    if (walletOp === 'credit') {
      const bal = user.balance ?? 0;
      if (Number(bal) >= Number(orderSumMoney)) {
        void reloadOrder('credit', {deliveryYmd, skipBalanceCheck: true});
        return;
      }
      const deficit = Math.max(0, Math.ceil(orderSumMoney - Number(bal)));
      const afterTopUp = () => {
        const ymd = repeatOrderDeliveryYmdRef.current;
        if (!ymd || !getClientMongoId(user) || !lastOrder) return;
        void reloadOrder('credit', {deliveryYmd: ymd, skipBalanceCheck: true});
      };
      if (clientHasInvoiceLegalData(user)) {
        void openTopUpModal(String(deficit), {
          onTopUpSuccess: afterTopUp,
          pendingOrder: buildPendingOrderDraft('credit', deliveryYmd),
        });
      } else {
        void openTopUpModal(String(deficit), {
          title: `${deficit.toLocaleString('ru-RU')} ₸`,
          subtitle: 'Способы пополнения',
          showCashPayment: true,
          onCashPayment: () => void reloadOrder('fakt', {deliveryYmd}),
          onTopUpSuccess: afterTopUp,
          pendingOrder: buildPendingOrderDraft('credit', deliveryYmd),
        });
      }
      return;
    }

    // Кошелёк: бутылями (купон)
    if (walletOp === 'coupon') {
      if (needed19 <= available19 && needed12 <= available12) {
        void reloadOrder('coupon', {deliveryYmd, skipBalanceCheck: true});
        return;
      }
      const afterTopUpCoupon = () => {
        const ymd = repeatOrderDeliveryYmdRef.current;
        if (!ymd || !getClientMongoId(user) || !lastOrder) return;
        void reloadOrder('coupon', {deliveryYmd: ymd, skipBalanceCheck: true});
      };
      if (clientHasInvoiceLegalData(user)) {
        void openTopUpModal(undefined, {
          onTopUpSuccess: afterTopUpCoupon,
          pendingOrder: buildPendingOrderDraft('coupon', deliveryYmd),
        });
      } else {
        setNotEnoughBalanceModalVisible(true);
      }
      return;
    }

    // Без типичного «кошелька» — форма оплаты повторяет прошлый заказ, но требует подтверждения.
    if (lastOrder.opForm === 'fakt') {
      setSelectedPayment({label: 'Наличными', value: 'fakt'});
    } else if (lastOrder.opForm === 'credit' || lastOrder.opForm === 'coupon') {
      const balanceValue =
        user.paymentMethod === 'coupon' ? 'coupon' : 'credit';
      setSelectedPayment({label: 'С баланса', value: balanceValue});
    } else {
      setSelectedPayment(null);
    }
    setPaymentModalVisible(true);
  };
  const showRepairMasterBlock = !!user && user.showRepairMasterInApp === true;

  /** Адрес по умолчанию для карточки создания заказа на главном экране — первый сохранённый адрес клиента. */
  const homeAddress = useMemo<OrderAddress | null>(() => {
    const saved = user?.addresses?.[0];
    if (!saved) return null;
    let actual = saved.street || '';
    if (saved.floor) actual += `, этаж ${saved.floor}`;
    if (saved.apartment) actual += `, квартира ${saved.apartment}`;
    return {
      name: saved.name,
      actual,
      link: saved.link || '',
      phone: saved.phone || user?.phone || '',
      point: {
        lat: saved.point?.lat || 0,
        lon: saved.point?.lon || 0,
      },
    };
  }, [user?.addresses, user?.phone]);

  /** Сколько бутылей каждого объёма клиент вернёт как обменную тару — остальное
   * сервер посчитает как новую тару и добавит её стоимость в списываемую сумму
   * (см. createClientOrderCore на бэкенде). */
  const getEmptyBottlesForBackend = (
    payload: CreateOrderPayload,
  ): {b12: number; b19: number} => ({
    b12: payload.hasEmptyBottles.b12 ? payload.emptyBottlesCount.b12 : 0,
    b19: payload.hasEmptyBottles.b19 ? payload.emptyBottlesCount.b19 : 0,
  });

  /** Черновик первого заказа для автосоздания на сервере, если клиент оплатит пополнение через Kaspi. */
  const buildFirstOrderPendingDraft = (
    payload: CreateOrderPayload,
    deliveryYmd: string,
    opForm: string = 'credit',
  ) => {
    const clientId = getClientMongoId(user);
    if (!clientId || !homeAddress) return undefined;
    return {
      clientId,
      address: homeAddress,
      products: {b12: payload.quantity12, b19: payload.quantity19},
      clientNotes: [],
      date: {d: deliveryYmd, time: ''},
      opForm,
      needCall: true,
      comment: '',
      emptyBottles: getEmptyBottlesForBackend(payload),
    };
  };

  /** Оформление первого заказа клиента — всегда с баланса, адрес всегда первый в списке. */
  const submitFirstOrder = async (payload: CreateOrderPayload) => {
    const clientId = getClientMongoId(user);
    if (!user || !clientId || !homeAddress) return;

    const deliveryYmd =
      repeatOrderDeliveryYmdRef.current || getNextDeliveryYmd();
    const products = {b12: payload.quantity12, b19: payload.quantity19};
    const balance = Number(user.balance || 0);

    if (balance < payload.total) {
      setFirstOrderModalVisible(false);
      const deficit = Math.max(0, Math.ceil(payload.total - balance));
      const afterTopUp = () => void submitFirstOrder(payload);
      const pendingOrder = buildFirstOrderPendingDraft(payload, deliveryYmd);
      if (clientHasInvoiceLegalData(user)) {
        void openTopUpModal(String(deficit), {
          onTopUpSuccess: afterTopUp,
          pendingOrder,
        });
      } else {
        void openTopUpModal(String(deficit), {
          title: `Не хватает ${deficit.toLocaleString('ru-RU')} ₸`,
          subtitle: 'Способы пополнения',
          onTopUpSuccess: afterTopUp,
          pendingOrder,
        });
      }
      return;
    }

    setFirstOrderSubmitting(true);
    try {
      const res = await apiService.addOrder(
        clientId,
        homeAddress,
        products,
        [],
        {d: deliveryYmd, time: ''},
        'credit',
        true,
        '',
        getEmptyBottlesForBackend(payload),
      );
      const alreadyCreatedByServer =
        !res.success && res.message === 'Заказ на эту дату уже существует';
      if (res.success || alreadyCreatedByServer) {
        repeatOrderDeliveryYmdRef.current = null;
        setFirstOrderModalVisible(false);
        setPendingFirstOrder(null);
        const showRef = Boolean(
          (res as {showReferralModal?: boolean}).showReferralModal,
        );
        logOrderPurchaseEvents({
          user,
          products,
          totalAmount: payload.total,
          orderId: (res as {order?: {_id?: string}}).order?._id,
        });
        const syncUserAndOrders = async () => {
          try {
            await refreshUserData();
            await getLastOrder();
            const activeRes = await apiService.getActiveOrders(clientId);
            if (activeRes?.orders) {
              setOrders(activeRes.orders);
            }
          } catch (e) {
            console.error('Ошибка обновления после заказа:', e);
          }
        };
        void syncUserAndOrders();
        const alertText = getDeliveryAcceptTextFromYmd(deliveryYmd);
        Alert.alert('Успешно', alertText, [
          {
            text: 'OK',
            onPress: () => {
              void syncUserAndOrders();
              if (showRef) setReferralPromoVisible(true);
            },
          },
        ]);
      } else {
        Alert.alert('Ошибка', res.message);
      }
    } catch (error: any) {
      const message = error?.response?.data?.message;
      if (message === 'Недостаточно средств на балансе') {
        setFirstOrderModalVisible(false);
        const deficit = Math.max(0, Math.ceil(payload.total - balance));
        const afterTopUp = () => void submitFirstOrder(payload);
        const pendingOrder = buildFirstOrderPendingDraft(payload, deliveryYmd);
        if (clientHasInvoiceLegalData(user)) {
          void openTopUpModal(String(deficit), {
            onTopUpSuccess: afterTopUp,
            pendingOrder,
          });
        } else {
          void openTopUpModal(String(deficit), {
            title: `Не хватает ${deficit.toLocaleString('ru-RU')} ₸`,
            subtitle: 'Способы пополнения',
            onTopUpSuccess: afterTopUp,
            pendingOrder,
          });
        }
      } else {
        Alert.alert('Ошибка', message || 'Не удалось оформить заказ');
      }
    } finally {
      setFirstOrderSubmitting(false);
    }
  };

  const handleCreateOrderFromMainCard = useCallback(
    (payload: CreateOrderPayload) => {
      repeatOrderDeliveryYmdRef.current = null;
      setRepeatAvailableDates(buildSelectableDeliveryDates(user ?? null));
      if (!lastOrder) {
        // Первый заказ клиента без истории — дата теперь тоже выбирается явно,
        // а не подставляется автоматически.
        setPendingFirstOrder(payload);
        setRepeatDateModalVisible(true);
        return;
      }
      // Заказ собран через «Изменить» на карточке повтора — клиент уже не новый,
      // поэтому даём полный флоу: выбор даты доставки и способа оплаты (включая наличные).
      setPendingCustomOrder(payload);
      setRepeatDateModalVisible(true);
    },
    [lastOrder, user],
  );

  const handleChatWithCourierFromMainCard = useCallback(
    (order: OrderData) => {
      navigation.navigate('CourierChat', {order});
    },
    [navigation],
  );

  const handleCancelOrderFromMainCard = useCallback(
    (order: OrderData) => {
      navigation.navigate('OrderStatus', {order});
    },
    [navigation],
  );

  /** Делает выбранный адрес домашним — переносит его в начало списка, так как это единственный сигнал «активного» адреса в модели пользователя. */
  const handleSelectHomeAddress = useCallback(
    async (addressId: string) => {
      if (!user?.addresses) return;
      const selectedIndex = user.addresses.findIndex(
        item => item._id === addressId,
      );
      if (selectedIndex <= 0) {
        setAddressModalVisible(false);
        return;
      }
      const reordered = [
        user.addresses[selectedIndex],
        ...user.addresses.slice(0, selectedIndex),
        ...user.addresses.slice(selectedIndex + 1),
      ];
      setAddressModalVisible(false);
      await updateUser('addresses', reordered);
    },
    [user?.addresses, updateUser],
  );

  const handleAddAddressFromModal = useCallback(() => {
    setAddressModalVisible(false);
    navigation.navigate('AddOrUpdateAddress', {address: null});
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea} edges={androidOnlySafeAreaEdges}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Header
          bonus={user?.balance || 0}
          paymentMethod={user?.paymentMethod || 'balance'}
          coupon={user?.paidBootles || 0}
          price19={user?.price19 || 1500}
          paidBootlesFor19={user?.paidBootlesFor19 || 0}
          paidBootlesFor12={user?.paidBootlesFor12 || 0}
          doesItTake19Bottles={user?.doesItTake19Bottles}
          doesItTake12Bottles={user?.doesItTake12Bottles}
          showBonus={true}
          onBonusPress={openTopUpModal}
        />
        <View style={styles.content}>
          <MainOrderCard
            address={homeAddress}
            orders={orders}
            lastOrder={lastOrder}
            price19={user?.price19 || 1500}
            price12={user?.price12 || 1100}
            onChangeAddress={() => setAddressModalVisible(true)}
            onChatWithCourier={handleChatWithCourierFromMainCard}
            onRepeatOrder={startRepeatLastOrderFlow}
            onCreateOrder={handleCreateOrderFromMainCard}
            onCancelOrder={handleCancelOrderFromMainCard}
          />

          <UsefulServices
            showRepair={showRepairMasterBlock}
            onRepairPress={openMasterCallConfirmModal}
            onInvitePress={handleInvitePress}
            onMarketplacePress={() =>
              Alert.alert('Скоро', 'Маркетплейс скоро будет доступен')
            }
          />

          <MainPageBanner
            navigation={navigation}
            setIsModalVisible={setIsModalVisible}
          />

          <View style={{height: 50}} />
        </View>
      </ScrollView>
      {/* <Navigation /> */}
      <Modal
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
        transparent={true}
        animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}>
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={e => e.stopPropagation()}>
            <Text style={{fontSize: 24, fontWeight: '700'}}>
              Вызов мастера на дом:
            </Text>

            <View
              style={{
                height: 1,
                backgroundColor: '#EDEDED',
                marginVertical: 16,
              }}
            />

            <Text
              style={{fontSize: 18, fontWeight: '600', textAlign: 'center'}}>
              Вызовите мастера и он устранит проблему
            </Text>

            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Позвонить</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <Modal
        visible={repeatDateModalVisible}
        onRequestClose={() => {
          repeatOrderDeliveryYmdRef.current = null;
          setPendingCustomOrder(null);
          setPendingFirstOrder(null);
          setRepeatDateModalVisible(false);
        }}
        transparent={true}
        animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlayReloadOrder}
          onPress={() => {
            repeatOrderDeliveryYmdRef.current = null;
            setPendingCustomOrder(null);
            setPendingFirstOrder(null);
            setRepeatDateModalVisible(false);
          }}>
          <TouchableOpacity
            style={[styles.modalContainerReloadOrder, {maxHeight: '70%'}]}
            onPress={e => e.stopPropagation()}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '600',
                color: '#101010',
                marginBottom: 16,
                textAlign: 'center',
              }}>
              Выберите дату доставки
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {repeatAvailableDates.map((date, index) => (
                <TouchableOpacity
                  key={date.value || index}
                  style={styles.modalAddress}
                  onPress={() => onRepeatDateSelectedFromModal(date.value)}>
                  <Text style={styles.modalAddressText}>{date.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <Modal
        visible={paymentModalVisible}
        onRequestClose={() => {
          setPendingCustomOrder(null);
          setPaymentModalVisible(false);
        }}
        transparent={true}
        animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlayReloadOrder}
          onPress={() => {
            setPendingCustomOrder(null);
            setPaymentModalVisible(false);
          }}>
          <TouchableOpacity
            style={styles.modalContainerReloadOrder}
            onPress={e => e.stopPropagation()}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '600',
                color: '#101010',
                marginBottom: 16,
                textAlign: 'center',
              }}>
              Способ оплаты
            </Text>
            {!clientHasInvoiceLegalData(user) ? (
              <TouchableOpacity
                style={styles.modalAddress}
                onPress={() => {
                  if (selectedPayment?.value === 'fakt') {
                    setSelectedPayment(null);
                  } else {
                    setSelectedPayment({label: 'Наличными', value: 'fakt'});
                  }
                }}>
                <Text style={styles.modalAddressText}>Наличными</Text>
                <View
                  style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor:
                      selectedPayment?.value === 'fakt' ? '#DC1818' : '#101010',
                  }}>
                  {selectedPayment?.value === 'fakt' && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: '#DC1818',
                      }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ) : null}
            {(user?.paymentMethod === 'balance' ||
              user?.paymentMethod === 'coupon') && (
              <TouchableOpacity
                style={styles.modalAddress}
                onPress={() => {
                  // Определяем правильное значение opForm в зависимости от paymentMethod пользователя
                  const balanceValue =
                    user?.paymentMethod === 'coupon' ? 'coupon' : 'credit';
                  if (selectedPayment?.value === balanceValue) {
                    setSelectedPayment(null);
                  } else {
                    setSelectedPayment({
                      label: 'С баланса',
                      value: balanceValue,
                    });
                  }
                }}>
                {user && user?.paymentMethod === 'coupon' ? (
                  <View>
                    <Text style={styles.modalAddressText}>С баланса</Text>
                    {user?.doesItTake19Bottles && user?.doesItTake12Bottles ? (
                      <Text
                        style={{color: '#46a54f', fontSize: 12, marginTop: 4}}>
                        ({user?.paidBootlesFor19 || 0} шт 18,9л,{' '}
                        {user?.paidBootlesFor12 || 0} шт 12,5л)
                      </Text>
                    ) : user?.doesItTake19Bottles ? (
                      <Text
                        style={{color: '#46a54f', fontSize: 12, marginTop: 4}}>
                        ({user?.paidBootlesFor19 || 0} шт 18,9л)
                      </Text>
                    ) : user?.doesItTake12Bottles ? (
                      <Text
                        style={{color: '#46a54f', fontSize: 12, marginTop: 4}}>
                        ({user?.paidBootlesFor12 || 0} шт 12,5л)
                      </Text>
                    ) : (
                      <Text
                        style={{color: '#46a54f', fontSize: 12, marginTop: 4}}>
                        (
                        {(user?.paidBootlesFor19 || 0) +
                          (user?.paidBootlesFor12 || 0)}{' '}
                        шт)
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.modalAddressText}>
                    С баланса{' '}
                    <Text style={{color: '#46a54f'}}>
                      ({Number(user?.balance || 0).toLocaleString('ru-RU')} ₸)
                    </Text>
                  </Text>
                )}
                <View
                  style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor:
                      selectedPayment?.value === 'credit' ||
                      selectedPayment?.value === 'coupon'
                        ? '#DC1818'
                        : '#101010',
                  }}>
                  {(selectedPayment?.value === 'credit' ||
                    selectedPayment?.value === 'coupon') && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: '#DC1818',
                      }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, !selectedPayment && {opacity: 0.5}]}
              disabled={!selectedPayment}
              onPress={() => {
                reloadOrder();
              }}>
              <Text style={styles.buttonText}>Подтвердить</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <Modal
        visible={notEnoughBalanceModalVisible}
        onRequestClose={() => setNotEnoughBalanceModalVisible(false)}
        transparent={true}
        animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlayReloadOrder}
          onPress={() => setNotEnoughBalanceModalVisible(false)}>
          <TouchableOpacity
            style={styles.modalContainerReloadOrder}
            onPress={e => e.stopPropagation()}>
            <Image
              source={require('../assets/wallet.png')}
              style={{
                width: 60,
                height: 60,
                marginBottom: 12,
                alignSelf: 'center',
              }}
            />
            {user?.paymentMethod === 'balance' ? (
              <>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '600',
                    color: '#101010',
                    marginBottom: 12,
                    textAlign: 'center',
                  }}>
                  Не хватает {lastOrder?.sum - (user?.balance || 0)} ₸
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#101010',
                    textAlign: 'center',
                  }}>
                  Ваш текущий баланс: {user?.balance || 0} ₸.
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#101010',
                    textAlign: 'center',
                  }}>
                  Для оформления заказа необходимо пополнить счет.
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '600',
                    color: '#101010',
                    marginBottom: 12,
                    textAlign: 'center',
                  }}>
                  Недостаточно бутылей
                </Text>
                {(lastOrder?.products?.b19 || 0) >
                  (user?.paidBootlesFor19 || 0) && (
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: '#101010',
                      textAlign: 'center',
                    }}>
                    18,9л: нужно {lastOrder?.products?.b19 || 0}, у вас{' '}
                    {user?.paidBootlesFor19 || 0} шт
                  </Text>
                )}
                {(lastOrder?.products?.b12 || 0) >
                  (user?.paidBootlesFor12 || 0) && (
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: '#101010',
                      textAlign: 'center',
                    }}>
                    12,5л: нужно {lastOrder?.products?.b12 || 0}, у вас{' '}
                    {user?.paidBootlesFor12 || 0} шт
                  </Text>
                )}
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#101010',
                    textAlign: 'center',
                    marginTop: 8,
                  }}>
                  Для оформления заказа необходимо пополнить баланс.
                </Text>
              </>
            )}
            <TouchableOpacity
              style={{
                backgroundColor: '#0d74d0',
                padding: 16,
                borderRadius: 8,
                marginTop: 40,
              }}
              onPress={() => {
                setNotEnoughBalanceModalVisible(false);
                setSelectedPayment(null);
                const ymdForDraft =
                  repeatOrderDeliveryYmdRef.current ?? getNextDeliveryYmd();
                if (
                  user?.paymentMethod === 'balance' &&
                  lastOrder?.sum != null
                ) {
                  const deficit = lastOrder.sum - (user?.balance || 0);
                  const afterMoney = () => {
                    const ymd = repeatOrderDeliveryYmdRef.current;
                    if (!ymd || !getClientMongoId(user) || !lastOrder) return;
                    void reloadOrder('credit', {
                      deliveryYmd: ymd,
                      skipBalanceCheck: true,
                    });
                  };
                  openTopUpModal(String(Math.max(0, Math.ceil(deficit))), {
                    onTopUpSuccess: afterMoney,
                    pendingOrder: buildPendingOrderDraft('credit', ymdForDraft),
                  });
                } else {
                  const afterCoupon = () => {
                    const ymd = repeatOrderDeliveryYmdRef.current;
                    if (!ymd || !getClientMongoId(user) || !lastOrder) return;
                    void reloadOrder('coupon', {
                      deliveryYmd: ymd,
                      skipBalanceCheck: true,
                    });
                  };
                  openTopUpModal(undefined, {
                    onTopUpSuccess: afterCoupon,
                    pendingOrder: buildPendingOrderDraft('coupon', ymdForDraft),
                  });
                }
              }}>
              {user?.paymentMethod === 'balance' ? (
                <Text style={styles.buttonText}>
                  Пополнить на {lastOrder?.sum - (user?.balance || 0)} ₸
                </Text>
              ) : (
                <Text style={styles.buttonText}>Пополнить баланс</Text>
              )}
            </TouchableOpacity>
            {!clientHasInvoiceLegalData(user) ? (
              <TouchableOpacity
                style={{
                  backgroundColor: '#DC1818',
                  padding: 16,
                  borderRadius: 8,
                  marginTop: 12,
                }}
                onPress={() =>
                  void reloadOrder('fakt', {
                    deliveryYmd:
                      repeatOrderDeliveryYmdRef.current ?? getNextDeliveryYmd(),
                  })
                }>
                <Text style={styles.buttonText}>Оплатить наличными</Text>
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <Modal
        visible={masterCallConfirmModalVisible}
        onRequestClose={() =>
          !masterCallLoading && setMasterCallConfirmModalVisible(false)
        }
        transparent={true}
        animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlayReloadOrder}
          activeOpacity={1}
          onPress={() =>
            !masterCallLoading && setMasterCallConfirmModalVisible(false)
          }>
          <TouchableOpacity
            style={{
              backgroundColor: 'white',
              borderRadius: 8,
              width: '80%',
              paddingTop: 24,
            }}
            activeOpacity={1}
            onPress={e => e.stopPropagation()}>
            <Image
              source={require('../assets/mainFix.png')}
              style={{
                width: 100,
                height: 100,
                marginBottom: 12,
                alignSelf: 'center',
              }}
            />
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#101010',
                marginBottom: 12,
                textAlign: 'center',
              }}>
              Заявка принята!
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: '#545454',
                textAlign: 'center',
                paddingHorizontal: 24,
              }}>
              {(() => {
                const now = new Date();
                const day = now.getDay();
                const h = now.getHours();
                const isWeekend =
                  (day === 5 && h >= 18) ||
                  day === 6 ||
                  day === 0 ||
                  (day === 1 && h < 9);
                return isWeekend
                  ? 'Ваша заявка принята. Наш менеджер свяжется с вами в ближайший будний день.\nСб–Вс — выходные.'
                  : 'Спасибо! Мастер свяжется с вами в течение 10 минут.';
              })()}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 24,
                borderTopWidth: 1,
                borderTopColor: '#EDEDED',
                paddingVertical: 12,
              }}>
              <View
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRightWidth: 1,
                  borderRightColor: '#EDEDED',
                  width: '50%',
                }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#DC1818',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: masterCallLoading ? 0.7 : 1,
                  }}
                  onPress={handleRequestMasterCall}
                  disabled={masterCallLoading}>
                  {masterCallLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 14,
                        fontWeight: '500',
                      }}>
                      Жду звонка
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <View
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '50%',
                }}>
                <TouchableOpacity
                  style={{
                    padding: 14,
                    alignItems: 'center',
                  }}
                  onPress={() =>
                    !masterCallLoading &&
                    setMasterCallConfirmModalVisible(false)
                  }
                  disabled={masterCallLoading}>
                  <Text
                    style={{fontSize: 14, fontWeight: '500', color: '#545454'}}>
                    Отмена
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <Modal
        visible={masterCallSuccessModalVisible}
        onRequestClose={() => setMasterCallSuccessModalVisible(false)}
        transparent={true}
        animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlayReloadOrder}
          onPress={() => setMasterCallSuccessModalVisible(false)}>
          <TouchableOpacity
            style={styles.modalContainerReloadOrder}
            onPress={e => e.stopPropagation()}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '600',
                color: '#101010',
                marginBottom: 12,
                textAlign: 'center',
              }}>
              Заявка отправлена
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: '#545454',
                textAlign: 'center',
              }}>
              В ближайшее время с вами свяжется мастер.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#DC1818',
                padding: 16,
                borderRadius: 8,
                marginTop: 24,
              }}
              onPress={() => setMasterCallSuccessModalVisible(false)}>
              <Text style={styles.buttonText}>Понятно</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ReferralPromoModal
        visible={referralPromoVisible}
        onDismiss={() => setReferralPromoVisible(false)}
        referralCode={user?.referralCode || ''}
      />

      <Modal
        visible={addressModalVisible}
        onRequestClose={() => setAddressModalVisible(false)}
        transparent={true}
        animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlayReloadOrder}
          onPress={() => setAddressModalVisible(false)}>
          <TouchableOpacity
            style={[styles.modalContainerReloadOrder, {maxHeight: '70%'}]}
            onPress={e => e.stopPropagation()}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '600',
                color: '#101010',
                marginBottom: 16,
                textAlign: 'center',
              }}>
              Адрес доставки
            </Text>
            {user?.addresses && user.addresses.length > 0 ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{maxHeight: 320}}>
                {user.addresses.map((item, index) => {
                  const selected = index === 0;
                  return (
                    <TouchableOpacity
                      key={item._id}
                      style={styles.modalAddress}
                      onPress={() => handleSelectHomeAddress(item._id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Выбрать адрес: ${
                        item.name || item.street
                      }`}>
                      <View style={{flex: 1}}>
                        <Text style={styles.modalAddressText}>
                          {item.name || 'Адрес доставки'}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            color: '#545454',
                            marginTop: 2,
                          }}>
                          {item.street}
                        </Text>
                      </View>
                      <View
                        style={{
                          justifyContent: 'center',
                          alignItems: 'center',
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: selected ? '#DC1818' : '#101010',
                        }}>
                        {selected && (
                          <View
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 5,
                              backgroundColor: '#DC1818',
                            }}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <Text
                style={{
                  fontSize: 14,
                  color: '#545454',
                  textAlign: 'center',
                  marginBottom: 16,
                }}>
                Адресов пока нет
              </Text>
            )}
            <TouchableOpacity
              style={styles.button}
              onPress={handleAddAddressFromModal}>
              <Text style={styles.buttonText}>Добавить адрес</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={firstOrderModalVisible}
        onRequestClose={() => {
          if (!firstOrderSubmitting) setFirstOrderModalVisible(false);
        }}
        transparent={true}
        animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlayReloadOrder}
          onPress={() => {
            if (!firstOrderSubmitting) setFirstOrderModalVisible(false);
          }}>
          <TouchableOpacity
            style={styles.modalContainerReloadOrder}
            onPress={e => e.stopPropagation()}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '600',
                color: '#101010',
                marginBottom: 16,
                textAlign: 'center',
              }}>
              Способ оплаты
            </Text>
            {homeAddress && (
              <Text
                style={{
                  fontSize: 13,
                  color: '#545454',
                  marginBottom: 16,
                  textAlign: 'center',
                }}>
                Адрес доставки: {homeAddress.actual}
              </Text>
            )}
            <View style={styles.modalAddress}>
              <Text style={styles.modalAddressText}>С баланса</Text>
              <View
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#DC1818',
                }}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#DC1818',
                  }}
                />
              </View>
            </View>
            {!lastOrder && (
              <Text
                style={{
                  fontSize: 12,
                  color: '#545454',
                  marginBottom: 16,
                }}>
                Первый заказ оплачивается с баланса.
              </Text>
            )}
            {pendingFirstOrder && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}>
                <Text style={{fontSize: 14, color: '#545454'}}>Итого:</Text>
                <Text
                  style={{fontSize: 16, fontWeight: '700', color: '#101010'}}>
                  {pendingFirstOrder.total.toLocaleString('ru-RU')} ₸
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.button}
              disabled={firstOrderSubmitting}
              onPress={() =>
                pendingFirstOrder && void submitFirstOrder(pendingFirstOrder)
              }>
              <Text style={styles.buttonText}>
                {firstOrderSubmitting ? 'Оформляем...' : 'Подтвердить'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    paddingBottom: 50,
  },
  content: {
    paddingHorizontal: 16,
  },
  specialOfferContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#DC1818',
    padding: 16,
    borderRadius: 8,
    marginTop: 32,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeOrdersContainer: {
    marginTop: 24,
  },
  activeOrdersTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeOrdersTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101010',
  },
  activeOrdersTitleButton: {
    padding: 3,
  },
  activeOrdersTitleButtonText: {
    color: '#DC1818',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'relative',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 8,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 40,
  },
  modalOverlayReloadOrder: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainerReloadOrder: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 8,
    width: '80%',
  },
  modalAddress: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EDEDED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalAddressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#101010',
  },
  modalButton: {
    padding: 16,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#0d74d0',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default HomeScreen;
