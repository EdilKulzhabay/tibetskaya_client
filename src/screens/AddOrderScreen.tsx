import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {androidOnlySafeAreaEdges} from '../utils/safeArea';
import Back from '../components/Back';
import {useAuth} from '../hooks';
import {useTopUpBalance} from '../context/TopUpBalanceContext';
import {useState, useCallback, useEffect, useRef} from 'react';
import {apiService} from '../api/services';
import {useFocusEffect} from '@react-navigation/native';
import ReferralPromoModal from '../components/ReferralPromoModal';
import {clientHasInvoiceLegalData} from '../utils/clientInvoiceProfile';
import {getWalletOpFormForUser} from '../utils/invoiceClientOrderPayment';
import {buildSelectableDeliveryDates} from '../utils/orderDeliveryDate';
import {getClientMongoId} from '../utils/clientId';
import {logOrderPurchaseEvents} from '../utils/facebookEvents';

const calls = [
  {label: 'Позвонить заранее', value: true},
  {label: 'Не звонить', value: false},
];

type PaymentOption = {label: string; value: string};

type HandleOrderOptions = {
  skipBalanceCheck?: boolean;
  paymentOverride?: PaymentOption;
};

const AddOrderScreen: React.FC<{navigation: any; route: any}> = ({
  navigation,
  route,
}) => {
  const {products, order} = route.params;
  const {user, refreshUserData} = useAuth();
  const {openTopUpModal} = useTopUpBalance();

  const [price12, setPrice12] = useState(user?.price12 || 1100);
  const [price19, setPrice19] = useState(user?.price19 || 1500);
  const [count12, setCount12] = useState(products.b12 || 0);
  const [count19, setCount19] = useState(products.b19 || 0);

  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [notEnoughBalanceModalVisible, setNotEnoughBalanceModalVisible] =
    useState(false);
  const [referralPromoVisible, setReferralPromoVisible] = useState(false);

  const [selectedAddress, setSelectedAddress] = useState<any>(
    order?.address || null,
  );
  const [selectedPayment, setSelectedPayment] = useState<any>(
    order?.payment || null,
  );
  const [selectedCall, setSelectedCall] = useState<any>(
    order?.call || calls[0],
  );
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [availableDates, setAvailableDates] = useState<any[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [scrollPaddingBottom, setScrollPaddingBottom] = useState(0);
  const [commentInputY, setCommentInputY] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);
  const commentInputRef = useRef<TextInput>(null);
  const isSubmittingRef = useRef(false);
  const continueOrderAfterTopUpRef = useRef<() => void>(() => {});
  const submitOrderAfterTopUpRef = useRef(false);

  /** Тот же адрес, что уходит в apiService.addOrder — нужен и в handleOrder, и заранее для черновика на случай ухода в Kaspi. */
  const buildOrderAddress = useCallback(() => {
    if (!selectedAddress) return null;
    let actualAddress = selectedAddress.street;
    if (selectedAddress.floor) {
      actualAddress += `, этаж ${selectedAddress.floor}`;
    }
    if (selectedAddress.apartment) {
      actualAddress += `, квартира ${selectedAddress.apartment}`;
    }
    return {
      actual: actualAddress,
      name: selectedAddress.name,
      phone: user?.phone,
      point: {
        lat: selectedAddress?.point?.lat || '',
        lon: selectedAddress?.point?.lon || '',
      },
      link: selectedAddress?.link || '',
    };
  }, [selectedAddress, user?.phone]);

  /**
   * Черновик заказа для сервера: если клиент уйдёт оплачивать Kaspi QR и не вернётся
   * в приложение, сервер создаст этот заказ сам сразу после зачисления баланса.
   */
  const buildPendingOrderDraft = useCallback(
    (opForm: string) => {
      const address = buildOrderAddress();
      const clientId = getClientMongoId(user);
      if (!clientId || !address || !selectedDate) return undefined;
      return {
        clientId,
        address,
        products: {b12: count12, b19: count19},
        clientNotes: [],
        date: {d: selectedDate.value, time: ''},
        opForm,
        needCall: selectedCall?.value,
        comment,
      };
    },
    [
      buildOrderAddress,
      user,
      selectedDate,
      count12,
      count19,
      selectedCall,
      comment,
    ],
  );

  const generateAvailableDates = useCallback(() => {
    const rows = buildSelectableDeliveryDates(user);
    return rows.map(row => ({
      value: row.value,
      label: row.label,
    }));
  }, [user]);

  // Инициализация доступных дат и начального значения
  useEffect(() => {
    const dates = generateAvailableDates();
    setAvailableDates(dates);
    setSelectedDate((prev: {value: string; label: string} | null) => {
      if (dates.length === 0) return null;
      if (prev && dates.some(d => d.value === prev.value)) {
        return prev;
      }
      return dates[0];
    });
  }, [generateAvailableDates]);

  // Обновляем данные пользователя при загрузке страницы
  useFocusEffect(
    useCallback(() => {
      refreshUserData();
    }, [refreshUserData]),
  );

  // Обновляем цены когда изменяются данные пользователя
  useEffect(() => {
    if (user) {
      console.log('💰 Обновляем цены:', user.price12, user.price19);
      setPrice12(user.price12 || 1100);
      setPrice19(user.price19 || 1500);
    }
  }, [user, user?.price12, user?.price19]);

  const handleOrder = async (options: HandleOrderOptions = {}) => {
    // Защита от двойного нажатия (синхронная проверка)
    if (isSubmittingRef.current) {
      return;
    }
    isSubmittingRef.current = true;
    setLoading(true);
    const payment = options.paymentOverride ?? selectedPayment;

    if (!selectedAddress) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите адрес доставки');
      setLoading(false);
      isSubmittingRef.current = false;
      return;
    }
    if (!payment) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите способ оплаты');
      setLoading(false);
      isSubmittingRef.current = false;
      return;
    }

    if (count12 + count19 < 2) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите хотя бы 2 бутыля воды');
      setLoading(false);
      isSubmittingRef.current = false;
      return;
    }

    if (!selectedCall) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите нужен ли звонок от курьера');
      setLoading(false);
      isSubmittingRef.current = false;
      return;
    }

    if (!selectedDate) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите дату доставки');
      setLoading(false);
      isSubmittingRef.current = false;
      return;
    }

    if (
      !options.skipBalanceCheck &&
      payment.value === 'credit' &&
      user?.paymentMethod === 'balance'
    ) {
      const totalAmount = count12 * price12 + count19 * price19;
      if (user?.balance !== undefined && user.balance < totalAmount) {
        setLoading(false);
        isSubmittingRef.current = false;
        if (clientHasInvoiceLegalData(user)) {
          const deficit = totalAmount - user.balance;
          submitOrderAfterTopUpRef.current = true;
          void openTopUpModal(String(Math.max(0, Math.ceil(deficit))), {
            onTopUpSuccess: () => continueOrderAfterTopUpRef.current(),
            pendingOrder: buildPendingOrderDraft('credit'),
          });
        } else {
          openNotEnoughBalanceTopUp(totalAmount - user.balance, true);
        }
        return;
      }
    }
    if (
      !options.skipBalanceCheck &&
      payment.value === 'coupon' &&
      user?.paymentMethod === 'coupon'
    ) {
      if (
        count19 > (user?.paidBootlesFor19 || 0) ||
        count12 > (user?.paidBootlesFor12 || 0)
      ) {
        setLoading(false);
        isSubmittingRef.current = false;
        if (clientHasInvoiceLegalData(user)) {
          submitOrderAfterTopUpRef.current = true;
          void openTopUpModal(undefined, {
            onTopUpSuccess: () => continueOrderAfterTopUpRef.current(),
            pendingOrder: buildPendingOrderDraft('coupon'),
          });
        } else {
          submitOrderAfterTopUpRef.current = true;
          setNotEnoughBalanceModalVisible(true);
        }
        return;
      }
    }

    const orderAddress = buildOrderAddress()!;

    try {
      const res = await apiService.addOrder(
        getClientMongoId(user),
        orderAddress,
        {b12: count12, b19: count19},
        [],
        {d: selectedDate?.value, time: ''},
        payment.value,
        selectedCall?.value,
        comment,
      );

      // "Заказ на эту дату уже существует" — сервер мог уже создать этот же заказ сам
      // (см. pendingOrder / автосоздание после пополнения баланса через Kaspi), это не ошибка.
      const alreadyCreatedByServer =
        !res.success && res.message === 'Заказ на эту дату уже существует';
      if (res.success || alreadyCreatedByServer) {
        const showRef = Boolean(
          (res as {showReferralModal?: boolean}).showReferralModal,
        );
        logOrderPurchaseEvents({
          user,
          products: {b12: count12, b19: count19},
          totalAmount: count12 * price12 + count19 * price19,
          orderId: (res as {order?: {_id?: string}}).order?._id,
        });
        /** Сбрасываем способ оплаты: экран оформления может оставаться в стеке, глобальное пополнение не должно «прилипать» к уже завершённому заказу. */
        setSelectedPayment(null);
        Alert.alert('Успешно', 'Заказ оформлен', [
          {
            text: 'OK',
            onPress: () => {
              void refreshUserData().then(() => {
                if (showRef) {
                  setReferralPromoVisible(true);
                } else {
                  navigation.navigate('Home');
                }
              });
            },
          },
        ]);
      } else {
        Alert.alert('Ошибка', res.message);
      }
    } catch (error: unknown) {
      console.error('Ошибка при оформлении заказа:', error);
      const msg =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as {response?: {data?: {message?: string}}}).response
          ?.data?.message === 'string'
          ? (error as {response: {data: {message: string}}}).response.data
              .message
          : 'Не удалось оформить заказ';
      Alert.alert('Ошибка', msg);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  continueOrderAfterTopUpRef.current = () => {
    const balancePayment: PaymentOption = {
      label: 'С баланса',
      value: user?.paymentMethod === 'coupon' ? 'coupon' : 'credit',
    };
    setSelectedPayment(balancePayment);
    const shouldSubmit = submitOrderAfterTopUpRef.current;
    submitOrderAfterTopUpRef.current = false;
    if (shouldSubmit) {
      setTimeout(() => {
        void handleOrder({
          skipBalanceCheck: true,
          paymentOverride: balancePayment,
        });
      }, 0);
    }
  };

  const openNotEnoughBalanceTopUp = (
    deficit: number,
    submitAfterTopUp = false,
  ) => {
    const roundedDeficit = Math.max(0, Math.ceil(deficit));
    submitOrderAfterTopUpRef.current = submitAfterTopUp;
    void openTopUpModal(String(roundedDeficit), {
      title: `${roundedDeficit.toLocaleString('ru-RU')} ₸`,
      subtitle: 'Способы пополнения',
      showCashPayment: true,
      onTopUpSuccess: () => continueOrderAfterTopUpRef.current(),
      pendingOrder: submitAfterTopUp
        ? buildPendingOrderDraft('credit')
        : undefined,
      onCashPayment: () => {
        const cashPayment: PaymentOption = {label: 'Наличными', value: 'fakt'};
        submitOrderAfterTopUpRef.current = false;
        setSelectedPayment(cashPayment);
        void handleOrder({paymentOverride: cashPayment});
      },
    });
  };

  /** Валидация полей без способа оплаты — модалки открываем только после «Оформить заказ». */
  const beginCheckout = () => {
    if (isSubmittingRef.current || loading) {
      return;
    }

    const lineTotal = count12 * price12 + count19 * price19;

    if (!selectedAddress) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите адрес доставки');
      return;
    }
    if (count12 + count19 < 2) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите хотя бы 2 бутыля воды');
      return;
    }
    if (!selectedCall) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите нужен ли звонок от курьера');
      return;
    }
    if (!selectedDate) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите дату доставки');
      return;
    }

    const invoice = clientHasInvoiceLegalData(user ?? null);

    if (invoice && user) {
      const op = getWalletOpFormForUser(user);
      if (op === 'credit') {
        void handleOrder({
          paymentOverride: {label: 'С баланса', value: 'credit'},
        });
        return;
      }
      if (op === 'coupon') {
        void handleOrder({
          paymentOverride: {label: 'С баланса', value: 'coupon'},
        });
        return;
      }
    }

    if (
      user?.paymentMethod === 'balance' &&
      user?.balance != null &&
      user.balance < lineTotal
    ) {
      submitOrderAfterTopUpRef.current = true;
      if (invoice) {
        void openTopUpModal(
          String(Math.max(0, Math.ceil(lineTotal - user.balance))),
          {
            onTopUpSuccess: () => continueOrderAfterTopUpRef.current(),
            pendingOrder: buildPendingOrderDraft('credit'),
          },
        );
      } else {
        openNotEnoughBalanceTopUp(lineTotal - user.balance, true);
      }
      return;
    }

    if (user?.paymentMethod === 'coupon') {
      const available19 = user?.paidBootlesFor19 || 0;
      const available12 = user?.paidBootlesFor12 || 0;

      if (count19 > available19 || count12 > available12) {
        submitOrderAfterTopUpRef.current = true;
        if (invoice) {
          void openTopUpModal(undefined, {
            onTopUpSuccess: () => continueOrderAfterTopUpRef.current(),
            pendingOrder: buildPendingOrderDraft('coupon'),
          });
        } else {
          setNotEnoughBalanceModalVisible(true);
        }
        return;
      }
    }

    setPaymentModalVisible(true);
  };

  useEffect(() => {
    if (
      user &&
      clientHasInvoiceLegalData(user) &&
      selectedPayment?.value === 'fakt'
    ) {
      setSelectedPayment(null);
    }
  }, [user, selectedPayment?.value]);

  useEffect(() => {
    if (!user || !clientHasInvoiceLegalData(user)) return;
    const total = count12 * price12 + count19 * price19;
    if (count12 + count19 < 2) return;
    const op = getWalletOpFormForUser(user);
    if (op === 'credit') {
      if (user.balance != null && user.balance >= total) {
        setSelectedPayment({label: 'С баланса', value: 'credit'});
      }
    } else if (op === 'coupon') {
      const ok =
        count19 <= (user.paidBootlesFor19 || 0) &&
        count12 <= (user.paidBootlesFor12 || 0);
      if (ok) {
        setSelectedPayment({label: 'С баланса', value: 'coupon'});
      }
    }
  }, [user, count12, count19, price12, price19]);

  return (
    <SafeAreaView style={styles.safeArea} edges={androidOnlySafeAreaEdges}>
      <Back navigation={navigation} title="Оформление заказа" />
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={{paddingBottom: scrollPaddingBottom}}>
        <View>
          {products.b12 >= 0 && user?.doesItTake12Bottles === true && (
            <View style={styles.productContainer}>
              <View style={styles.productTop}>
                <View style={styles.product}>
                  <View>
                    <Image
                      source={require('../assets/bottleProduct12.png')}
                      style={styles.productImage}
                    />
                  </View>
                  <View>
                    <Text style={styles.productTitle}>Вода 12,5 л</Text>
                    <Text style={styles.productSubtitle}>Негазированная</Text>
                  </View>
                </View>
                <View style={styles.productBottoms}>
                  <TouchableOpacity
                    style={styles.productBottomsPlusMinus}
                    onPress={() => {
                      if (count12 > 0) {
                        setCount12(count12 - 1);
                      }
                    }}>
                    <Image
                      source={require('../assets/minus.png')}
                      style={styles.productBottomsIcon}
                    />
                  </TouchableOpacity>
                  <Text style={styles.productBottomsCount}>{count12}</Text>
                  <TouchableOpacity
                    style={styles.productBottomsPlusMinus}
                    onPress={() => {
                      setCount12(count12 + 1);
                    }}>
                    <Image
                      source={require('../assets/plus.png')}
                      style={styles.productBottomsIcon}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View
                style={{
                  height: 1,
                  backgroundColor: '#E3E3E3',
                  marginVertical: 12,
                  width: '100%',
                }}
              />
              <View style={styles.productBottom}>
                <View style={styles.productBottomTitle}>
                  <Text style={styles.productBottomTitleText}>Цена:</Text>
                  <Text style={styles.productBottomTitleText}>Итого:</Text>
                </View>
                <View style={styles.productBottomSum}>
                  <Text style={styles.productBottomSumText}>{price12} ₸</Text>
                  <Text style={[styles.productBottomSumText, {color: '#000'}]}>
                    {count12 * price12} ₸
                  </Text>
                </View>
              </View>
            </View>
          )}
          {products.b19 >= 0 && (
            <View style={styles.productContainer}>
              <View style={styles.productTop}>
                <View style={styles.product}>
                  <View>
                    <Image
                      source={require('../assets/bottleProduct.png')}
                      style={styles.productImage}
                    />
                  </View>
                  <View>
                    <Text style={styles.productTitle}>Вода 18,9 л</Text>
                  </View>
                </View>
                <View style={styles.productBottoms}>
                  <TouchableOpacity
                    style={styles.productBottomsPlusMinus}
                    onPress={() => {
                      if (count19 > 0) {
                        setCount19(count19 - 1);
                      }
                    }}>
                    <Image
                      source={require('../assets/minus.png')}
                      style={styles.productBottomsIcon}
                    />
                  </TouchableOpacity>
                  <Text style={styles.productBottomsCount}>{count19}</Text>
                  <TouchableOpacity
                    style={styles.productBottomsPlusMinus}
                    onPress={() => {
                      setCount19(count19 + 1);
                    }}>
                    <Image
                      source={require('../assets/plus.png')}
                      style={styles.productBottomsIcon}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View
                style={{
                  height: 1,
                  backgroundColor: '#E3E3E3',
                  marginVertical: 12,
                  width: '100%',
                }}
              />
              <View style={styles.productBottom}>
                <View style={styles.productBottomTitle}>
                  <Text style={styles.productBottomTitleText}>Цена:</Text>
                  <Text style={styles.productBottomTitleText}>Итого:</Text>
                </View>
                <View style={styles.productBottomSum}>
                  <Text style={styles.productBottomSumText}>{price19} ₸</Text>
                  <Text style={[styles.productBottomSumText, {color: '#000'}]}>
                    {count19 * price19} ₸
                  </Text>
                </View>
              </View>
            </View>
          )}

          {count12 > 0 && count19 > 0 && (
            <View
              style={{
                marginTop: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 16,
              }}>
              <Text style={{fontSize: 18, fontWeight: '500', color: '#101010'}}>
                Общая сумма:
              </Text>
              <Text style={{color: '#000', fontSize: 16, fontWeight: '600'}}>
                {count12 * price12 + count19 * price19} ₸
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.additionalInfo, {marginTop: 32}]}
            onPress={() => setDateModalVisible(true)}>
            <View>
              <Text
                style={{
                  fontWeight: '500',
                  color: '#99A3B3',
                  fontSize: selectedDate ? 14 : 16,
                  transform: selectedDate ? [{translateY: -8}] : [],
                }}>
                Дата доставки
              </Text>
              {selectedDate && (
                <Text style={{fontSize: 18, fontWeight: '500'}}>
                  {' '}
                  {selectedDate?.label}
                </Text>
              )}
            </View>
            <Image
              source={require('../assets/arrowDown.png')}
              style={{width: 24, height: 24}}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.additionalInfo, {marginTop: 24}]}
            onPress={() => setAddressModalVisible(true)}>
            <View>
              <Text
                style={{
                  fontWeight: '500',
                  color: '#99A3B3',
                  fontSize: selectedAddress ? 14 : 16,
                  transform: selectedAddress ? [{translateY: -8}] : [],
                }}>
                Адрес доставки
              </Text>
              {selectedAddress && (
                <Text style={{fontSize: 18, fontWeight: '500'}}>
                  {' '}
                  {selectedAddress?.name}
                </Text>
              )}
            </View>
            <Image
              source={require('../assets/arrowDown.png')}
              style={{width: 24, height: 24}}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.additionalInfo, {marginTop: 24}]}
            onPress={() => setCallModalVisible(true)}>
            <View>
              <Text
                style={{
                  fontWeight: '500',
                  color: '#99A3B3',
                  fontSize: selectedCall ? 14 : 16,
                  transform: selectedCall ? [{translateY: -8}] : [],
                }}>
                Звонок курьера перед доставкой
              </Text>
              {selectedCall && (
                <Text style={{fontSize: 18, fontWeight: '500'}}>
                  {' '}
                  {selectedCall?.label}
                </Text>
              )}
            </View>
            <Image
              source={require('../assets/arrowDown.png')}
              style={{width: 24, height: 24}}
            />
          </TouchableOpacity>

          <View
            style={[styles.additionalInfo, {marginTop: 24}]}
            onLayout={event => {
              const {y} = event.nativeEvent.layout;
              setCommentInputY(y);
            }}>
            <TextInput
              ref={commentInputRef}
              style={{
                fontSize: 16,
                color: '#101010',
                minHeight: 64,
                textAlignVertical: 'top',
                width: '100%',
                borderWidth: 1,
                borderColor: '#E3E3E3',
                borderRadius: 12,
                padding: 12,
                backgroundColor: '#F8F8F8',
              }}
              value={comment}
              onChangeText={setComment}
              placeholder="Комментарий для курьера..."
              multiline={true}
              numberOfLines={4}
              maxLength={400}
              onFocus={() => {
                setScrollPaddingBottom(300);
                setTimeout(() => {
                  if (scrollViewRef.current && commentInputY > 0) {
                    scrollViewRef.current.scrollTo({
                      y: commentInputY - 100,
                      animated: true,
                    });
                  }
                }, 100);
              }}
              onBlur={() => {
                setScrollPaddingBottom(0);
              }}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, {marginTop: 12}]}
          onPress={() => {
            beginCheckout();
          }}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Оформить заказ</Text>
          )}
        </TouchableOpacity>

        <View style={{height: 80}} />
      </ScrollView>

      <Modal
        visible={addressModalVisible}
        onRequestClose={() => setAddressModalVisible(false)}
        transparent={true}
        animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setAddressModalVisible(false)}>
          <TouchableOpacity
            style={styles.modalContainer}
            onPress={e => e.stopPropagation()}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '600',
                color: '#101010',
                marginBottom: 16,
                textAlign: 'center',
              }}>
              Выберите адрес доставки
            </Text>
            {user?.addresses?.map((address, index) => (
              <TouchableOpacity
                key={address._id || index}
                style={styles.modalAddress}
                onPress={() => {
                  if (selectedAddress?.name === address.name) {
                    setSelectedAddress(null);
                  } else {
                    setSelectedAddress(address);
                    // setAddressModalVisible(false);
                  }
                }}>
                <View>
                  <Text style={styles.modalAddressText}>{address.name}</Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '400',
                      color: '#6A7282',
                      marginTop: 4,
                    }}>
                    {address.street}
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
                    borderColor:
                      selectedAddress?._id === address._id
                        ? '#DC1818'
                        : '#101010',
                  }}>
                  {selectedAddress?.name === address.name && (
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
            ))}

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderStyle: 'dashed',
                padding: 16,
                borderRadius: 16,
              }}
              onPress={() => {
                setAddressModalVisible(false);
                if (!user) {
                  navigation.navigate('Login');
                } else {
                  navigation.navigate('AddOrUpdateAddress', {address: null});
                }
              }}>
              <Image
                source={require('../assets/addAddressIcon.png')}
                style={{width: 24, height: 24}}
              />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: '#FB2C36',
                  marginLeft: 8,
                }}>
                Добавить адрес
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, {marginTop: 12}]}
              onPress={() => setAddressModalVisible(false)}>
              <Text style={styles.buttonText}>Продолжить</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={paymentModalVisible}
        onRequestClose={() => setPaymentModalVisible(false)}
        transparent={true}
        animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setPaymentModalVisible(false)}>
          <TouchableOpacity
            style={styles.modalContainer}
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
            {!clientHasInvoiceLegalData(user) && (
              <TouchableOpacity
                style={styles.modalAddress}
                onPress={() => {
                  if (selectedPayment?.value === 'fakt') {
                    setSelectedPayment(null);
                    return;
                  }
                  const pay: PaymentOption = {
                    label: 'Наличными',
                    value: 'fakt',
                  };
                  setSelectedPayment(pay);
                  setPaymentModalVisible(false);
                  void handleOrder({paymentOverride: pay});
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
            )}
            {(user?.paymentMethod === 'balance' ||
              user?.paymentMethod === 'coupon') && (
              <TouchableOpacity
                style={styles.modalAddress}
                onPress={() => {
                  const balanceValue =
                    user?.paymentMethod === 'coupon' ? 'coupon' : 'credit';
                  if (selectedPayment?.value === balanceValue) {
                    setSelectedPayment(null);
                    return;
                  }
                  const pay: PaymentOption = {
                    label: 'С баланса',
                    value: balanceValue,
                  };
                  setSelectedPayment(pay);
                  setPaymentModalVisible(false);
                  void handleOrder({paymentOverride: pay});
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
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={callModalVisible}
        onRequestClose={() => setCallModalVisible(false)}
        transparent={true}
        animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setCallModalVisible(false)}>
          <TouchableOpacity
            style={styles.modalContainer}
            onPress={e => e.stopPropagation()}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '600',
                color: '#101010',
                marginBottom: 16,
                textAlign: 'center',
              }}>
              Нужен ли звонок от курьера?
            </Text>
            {calls.map((call, index) => (
              <TouchableOpacity
                key={call.label || index}
                style={styles.modalAddress}
                onPress={() => {
                  setSelectedCall(call);
                  setCallModalVisible(false);
                }}>
                <Text style={styles.modalAddressText}>{call.label}</Text>
                <View
                  style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor:
                      selectedCall?.value === call?.value
                        ? '#DC1818'
                        : '#101010',
                  }}>
                  {selectedCall?.value === call?.value && (
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
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={dateModalVisible}
        onRequestClose={() => setDateModalVisible(false)}
        transparent={true}
        animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setDateModalVisible(false)}>
          <TouchableOpacity
            style={[styles.modalContainer, {maxHeight: '70%'}]}
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
              {availableDates.map((date, index) => (
                <TouchableOpacity
                  key={date.value || index}
                  style={styles.modalAddress}
                  onPress={() => {
                    setSelectedDate(date);
                    setDateModalVisible(false);
                  }}>
                  <Text style={styles.modalAddressText}>{date.label}</Text>
                  <View
                    style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor:
                        selectedDate?.value === date?.value
                          ? '#DC1818'
                          : '#101010',
                    }}>
                    {selectedDate?.value === date?.value && (
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
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={notEnoughBalanceModalVisible}
        onRequestClose={() => setNotEnoughBalanceModalVisible(false)}
        transparent={true}
        animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setNotEnoughBalanceModalVisible(false)}>
          <TouchableOpacity
            style={styles.modalContainer}
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
                  Не хватает{' '}
                  {count12 * price12 + count19 * price19 - (user?.balance || 0)}{' '}
                  ₸
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
                {count19 > (user?.paidBootlesFor19 || 0) && (
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: '#101010',
                      textAlign: 'center',
                    }}>
                    18,9л: нужно {count19}, у вас {user?.paidBootlesFor19 || 0}{' '}
                    шт
                  </Text>
                )}
                {count12 > (user?.paidBootlesFor12 || 0) && (
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: '#101010',
                      textAlign: 'center',
                    }}>
                    12,5л: нужно {count12}, у вас {user?.paidBootlesFor12 || 0}{' '}
                    шт
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
            {/* <Text style={{fontSize: 20, fontWeight: '600', color: '#101010', marginBottom: 12, textAlign: 'center'}}>Не хватает {count12 * price12 + count19 * price19 - (user?.balance || 0)} ₸</Text>
                        <Text style={{fontSize: 14, fontWeight: '500', color: '#101010', textAlign: 'center'}}>Ваш текущий баланс: {user?.balance || 0} ₸.</Text>
                        <Text style={{fontSize: 14, fontWeight: '500', color: '#101010', textAlign: 'center'}}>Для оформления заказа необходимо пополнить счет.</Text> */}
            <TouchableOpacity
              style={{
                backgroundColor: '#0d74d0',
                padding: 16,
                borderRadius: 8,
                marginTop: 40,
              }}
              onPress={() => {
                setNotEnoughBalanceModalVisible(false);
                if (user?.paymentMethod === 'balance') {
                  const deficit =
                    count12 * price12 +
                    count19 * price19 -
                    (user?.balance || 0);
                  openTopUpModal(String(Math.max(0, Math.ceil(deficit))), {
                    onTopUpSuccess: () => continueOrderAfterTopUpRef.current(),
                    pendingOrder: buildPendingOrderDraft('credit'),
                  });
                } else {
                  openTopUpModal(undefined, {
                    onTopUpSuccess: () => continueOrderAfterTopUpRef.current(),
                    pendingOrder: buildPendingOrderDraft('coupon'),
                  });
                }
              }}>
              {user?.paymentMethod === 'balance' ? (
                <Text style={styles.buttonText}>
                  Пополнить на{' '}
                  {count12 * price12 + count19 * price19 - (user?.balance || 0)}{' '}
                  ₸
                </Text>
              ) : (
                <Text style={styles.buttonText}>Пополнить баланс</Text>
              )}
            </TouchableOpacity>
            {!clientHasInvoiceLegalData(user) ? (
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {marginTop: 10, backgroundColor: '#DC1818'},
                ]}
                onPress={() => {
                  setNotEnoughBalanceModalVisible(false);
                  const cashPayment: PaymentOption = {
                    label: 'Наличными',
                    value: 'fakt',
                  };
                  submitOrderAfterTopUpRef.current = false;
                  setSelectedPayment(cashPayment);
                  void handleOrder({paymentOverride: cashPayment});
                }}>
                <Text style={styles.modalButtonText}>Оплатить наличными</Text>
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ReferralPromoModal
        visible={referralPromoVisible}
        onDismiss={() => {
          setReferralPromoVisible(false);
          navigation.navigate('Home');
        }}
        referralCode={user?.referralCode || ''}
      />
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
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  productContainer: {
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  product: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  productImage: {
    width: 40,
    height: 60,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#101010',
  },
  productSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#101010',
  },
  productBottoms: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    borderRadius: 12,
  },
  productBottomsPlusMinus: {
    padding: 6,
  },
  productBottomsIcon: {
    width: 16,
    height: 16,
  },
  productBottomsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#99A3B3',
  },
  productBottom: {},
  productBottomTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productBottomTitleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#545454',
  },
  productBottomSum: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productBottomSumText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#101010',
  },
  additionalInfo: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: '#EDEDED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalAddressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#101010',
  },
  button: {
    backgroundColor: '#DC1818',
    padding: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalButton: {
    padding: 16,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default AddOrderScreen;
