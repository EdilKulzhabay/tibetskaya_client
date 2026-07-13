import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  DeviceEventEmitter,
  Modal,
  Linking,
  TextInput,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { AwaitingOrderView, OnTheWayView, Back } from '../components';
import { apiService } from '../api/services';

type OrderStatusRouteProp = RouteProp<RootStackParamList, 'OrderStatus'>;
type OrderStatusNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OrderStatus'>;

const OrderStatusScreen: React.FC = () => {
  const route = useRoute<OrderStatusRouteProp>();
  const navigation = useNavigation<OrderStatusNavigationProp>();
  
  // Получаем данные заказа из параметров и храним в state
  const [order, setOrder] = useState(route.params.order);
  const [isCourierModalVisible, setIsCourierModalVisible] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [courierData, setCourierData] = useState<{ fullName?: string; phone?: string } | null>(null);
  const [shouldShowCourierModal, setShouldShowCourierModal] = useState(false);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState<any>(null);
  const [otherReasonText, setOtherReasonText] = useState('');
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    console.log('🔄 OrderStatusScreen: order', order);
  }, [order]);

  // Подписка на обновления статуса текущего заказа
  useEffect(() => {
    let isMounted = true;
    
    const subscription = DeviceEventEmitter.addListener(
      'orderStatusUpdated',
      async ({ orderId, newStatus }) => {
        // Проверяем, что компонент все еще смонтирован
        if (!isMounted) {
          return;
        }
        
        // Проверяем наличие обязательных данных
        if (!orderId || !newStatus) {
          console.warn('⚠️ OrderStatusScreen: Неполные данные обновления заказа:', { orderId, newStatus });
          return;
        }
        const fetchOrder = async () => {
          const orderData = await apiService.getOrder(orderId);
          return orderData;
        }
        const orderData = await fetchOrder();
        if (!orderData) {
          console.warn('⚠️ OrderStatusScreen: Не удалось получить данные заказа:', orderId);
          return;
        }
        
        // Проверяем, это обновление для текущего заказа?
        if (orderId === order._id) {
          console.log('🔄 OrderStatusScreen: Статус заказа обновлен: orderId', orderId);
          console.log('🔄 OrderStatusScreen: Статус заказа обновлен: newStatus', newStatus);
          console.log('🔄 OrderStatusScreen: Статус заказа обновлен: orderData', orderData);
          
          // Обновляем состояние заказа с защитой от null
          setOrder(orderData.order);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [order._id]);

  const getStatusText = (status: string) => {
    switch (status) {
      case "awaitingOrder":
        return "Заказ принят";
      case "onTheWay":
        return "В пути";
      case "delivered":
        return "Доставлен";
      default:
        return "Отменен";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "awaitingOrder":
      case "onTheWay":
        return "#EB7E00";
      case "delivered":
        return "#00B01A";
      default:
        return "#DC1818";
    }
  };

  const cancelReasons = [
    { id: 'not_home', label: 'Не буду дома' },
    { id: 'wrong_date', label: 'Неправильно указал дату' },
    { id: 'changed_mind', label: 'Передумал' },
    { id: 'other', label: 'Другое' },
  ];

  const readyReviews = [
    'Быстро привезли',
    'Слишком долго',
    'Вежливый курьер',
    'Все аккуратно доставлено',
    'Проблемы с качеством',
    'Отличный сервис',
  ];

  const handleReviewToggle = (review: string) => {
    setSelectedReviews(prev => {
      if (prev.includes(review)) {
        return prev.filter(r => r !== review);
      } else {
        return [...prev, review];
      }
    });
  };

  const handleSubmitReview = async () => {
    if (selectedReviews.length === 0) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите хотя бы один отзыв');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const response = await apiService.updateOrderData(order._id, "clientNotes", selectedReviews);
      if (response.success) {
        // Обновляем заказ с новыми отзывами
        const updatedOrder = response.order;
        if (updatedOrder) {
          setOrder(updatedOrder);
        }
        setSelectedReviews([]);
        Alert.alert('Успешно', 'Ваш отзыв отправлен');
      } else {
        Alert.alert('Ошибка', response.message || 'Не удалось отправить отзыв');
      }
    } catch (error) {
      console.error('Ошибка при отправке отзыва:', error);
      Alert.alert('Ошибка', 'Не удалось отправить отзыв. Попробуйте позже.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleCancelOrder = () => {
    setIsCancelModalVisible(true);
    setSelectedCancelReason(null);
    setOtherReasonText('');
  };

  const handleConfirmCancel = async () => {
    if (!selectedCancelReason?.id) {
      Alert.alert('Ошибка', 'Пожалуйста, выберите причину отмены заказа');
      return;
    }

    if (selectedCancelReason?.id === 'other' && !otherReasonText.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, укажите причину отмены');
      return;
    }

    try {
      const reason = selectedCancelReason?.id === 'other' ? otherReasonText : selectedCancelReason?.label;
      // Здесь можно передать причину отмены на сервер, если API поддерживает
      await apiService.cancelOrder(order._id, reason);
      setIsCancelModalVisible(false);
      navigation.goBack();
    } catch (error) {
      console.error('Ошибка при отмене заказа:', error);
      Alert.alert('Ошибка', 'Не удалось отменить заказ. Попробуйте позже.');
    }
  };

  const handleCallCourier = async () => {
    try {
      // Обновляем данные заказа
      const response = await apiService.getOrder(order._id);
      console.log('🔄 OrderStatusScreen: handleCallCourier response', response);
      const updatedOrder = response.order;
      setOrder(updatedOrder);
      
      // Проверяем наличие курьера в обновленных данных
      const courierAggregator = updatedOrder.courierAggregator;
      
      if (!courierAggregator) {
        // Курьер еще не назначен
        Alert.alert(
          'Курьер не назначен',
          'Курьер еще не назначен на ваш заказ. Пожалуйста, подождите.',
          [{ text: 'Понятно' }]
        );
        return;
      }
      
      // Сохраняем данные курьера (если есть)
      if (typeof courierAggregator === 'object') {
        console.log('🔄 OrderStatusScreen: courierAggregator 141', courierAggregator);
        setCourierData({
          fullName: courierAggregator.fullName,
          phone: courierAggregator.phone || undefined,
        });
      } else {
        setCourierData(null);
      }
      
      // Показываем баннер перед действием
      setIsBannerVisible(true);
      setShouldShowCourierModal(true);
    } catch (error) {
      console.error('Ошибка при обновлении заказа:', error);
      Alert.alert(
        'Ошибка',
        'Не удалось обновить данные заказа. Попробуйте позже.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCallCourierPhone = () => {
    if (courierData && courierData.phone) {
      const phoneNumber = courierData.phone.replace(/\s/g, ''); // Убираем пробелы
      Linking.openURL(`tel:${phoneNumber}`);
      setIsCourierModalVisible(false);
    }
  };

  // Условный рендер в зависимости от статуса
  const renderOrderContent = () => {
    switch (order.status) {
      case "awaitingOrder":
        return (
          <AwaitingOrderView
            order={order} 
            onCancelOrder={handleCancelOrder}
            onCallCourier={handleCallCourier}
            navigation={navigation}
          />
        );
        
      case "onTheWay":
        return (
          // <View></View>
          <OnTheWayView
            order={order}
            onCallCourier={handleCallCourier}
            onChatWithCourier={() => navigation.navigate('CourierChat', { order })}
          />
        );
        
      default:
        // Для остальных статусов показываем стандартную страницу
        return (
          <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderTitle}>Заказ</Text>
                <Text style={[styles.orderStatus, { color: getStatusColor(order.status) }]}>
                  {getStatusText(order.status)}
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Дата заказа:</Text>
                <Text style={styles.infoValue}>
                  {typeof order.date === 'string' ? order.date : order.date?.d || 'Не указана'}
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Статус:</Text>
                <Text style={[styles.infoValue, { color: getStatusColor(order.status) }]}>
                  {getStatusText(order.status)}
                </Text>
              </View>

              {order.courier && (
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Курьер:</Text>
                  <Text style={styles.infoValue}>
                    {typeof order.courier === 'string' ? 'ID: ' + order.courier : order.courier?.fullName || 'Неизвестно'}
                  </Text>
                </View>
              )}

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Способ оплаты:</Text>
                <Text style={styles.infoValue}>
                  {order.opForm === "fakt" ? "Нал_Карта_QR" : (order.opForm === "credit" || order.opForm === "coupon") ? "С баланса" : 'Нал_Карта_QR'}
                </Text>
              </View>

              <View style={styles.productsCard}>
                <Text style={styles.cardTitle}>Товары в заказе:</Text>
                {order && order.products && order.products.b12 && order.products.b12 > 0 && (
                  <View style={styles.productItem}>
                    <Text style={styles.productText}>
                      Бутылка 12л: {order.products.b12} шт.
                    </Text>
                  </View>
                )}
                {order && order.products && order.products.b19 && order.products.b19 > 0 && (
                  <View style={styles.productItem}>
                    <Text style={styles.productText}>
                      Бутылка 19л: {order.products.b19} шт.
                    </Text>
                  </View>
                )}
              </View>

              {order.status === "delivered" && order.clientNotes && order.clientNotes.length > 0 && (
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Отзыв:</Text>
                  <View style={styles.reviewsContainer}>
                    {Array.isArray(order.clientNotes) ? (
                      order.clientNotes.map((note: string, index: number) => (
                        <View key={index} style={styles.reviewChip}>
                          <Text style={styles.reviewChipText}>{note}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.infoValue}>{String(order.clientNotes)}</Text>
                    )}
                  </View>
                </View>
              )}

              {order.status === "delivered" && order.clientNotes.length === 0 && (
                <View style={styles.reviewCard}>
                  <Text style={styles.reviewTitle}>Оставьте отзыв:</Text>
                  <Text style={styles.reviewSubtitle}>Выберите один или несколько вариантов</Text>
                  
                  <View style={styles.reviewsContainer}>
                    {readyReviews.map((review, index) => {
                      const isSelected = selectedReviews.includes(review);
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.reviewChip,
                            isSelected && styles.reviewChipSelected
                          ]}
                          onPress={() => handleReviewToggle(review)}
                        >
                          <Text style={[
                            styles.reviewChipText,
                            isSelected && styles.reviewChipTextSelected
                          ]}>
                            {review}
                          </Text>
                          {isSelected && (
                            <View style={styles.reviewCheckmark}>
                              <Text style={styles.reviewCheckmarkText}>✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {selectedReviews.length > 0 && (
                    <TouchableOpacity
                      style={[
                        styles.submitReviewButton,
                        isSubmittingReview && styles.submitReviewButtonDisabled
                      ]}
                      onPress={handleSubmitReview}
                      disabled={isSubmittingReview}
                    >
                      <Text style={styles.submitReviewButtonText}>
                        {isSubmittingReview ? 'Отправка...' : `Отправить отзыв (${selectedReviews.length})`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>Назад к заказам</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, isBannerVisible && styles.safeAreaWithBanner]}>
      <Back navigation={navigation} title="Заказ" />
      
      {renderOrderContent()}

      {/* Модальное окно для звонка курьеру */}
      <Modal
        visible={isCourierModalVisible}
        onRequestClose={() => setIsCourierModalVisible(false)}
        transparent={true}
        animationType="slide"
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsCourierModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalContainer} 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Позвонить курьеру</Text>
            
            <View style={styles.modalDivider} />
            
            {courierData && courierData.phone ? (
              <>
                <Text style={styles.modalText}>
                  {courierData.fullName || 'Курьер'}
                </Text>
                <TouchableOpacity 
                  style={styles.modalCallButton}
                  onPress={handleCallCourierPhone}
                >
                  <Text style={styles.modalCallButtonText}>
                    {courierData.phone}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.modalText}>
                Курьер еще не назначен на ваш заказ.
              </Text>
            )}
            
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setIsCourierModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Баннер-сниппет с информацией о курьерах - поверх модального окна */}
        {isBannerVisible && (
          <View style={styles.bannerContainerModal}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>Важно</Text>
              <Text style={styles.bannerText}>
                Курьеры назначаются автоматически — по рейтингу и близости к вашему адресу.
              </Text>
              <Text style={styles.bannerText}>
                📌 Сохранять номер курьера не нужно.
              </Text>
              <Text style={styles.bannerText}>
                📌 Оформляйте новые заказы только через приложение, чтобы избежать недоразумений.
              </Text>
              <TouchableOpacity 
                style={styles.bannerButton}
                onPress={() => {
                  setIsBannerVisible(false);
                  // Если нужно звонить или показать модальное окно после закрытия баннера
                  if (shouldShowCourierModal) {
                    if (courierData && courierData.phone) {
                      // Если есть номер, сразу звоним
                      const phoneNumber = courierData.phone.replace(/\s/g, '');
                      Linking.openURL(`tel:${phoneNumber}`);
                    } else {
                      // Если нет номера, показываем модальное окно
                      setIsCourierModalVisible(true);
                    }
                    setShouldShowCourierModal(false);
                  }
                }}
              >
                <Text style={styles.bannerButtonText}>Понятно</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* Баннер-сниппет с информацией о курьерах - вне модального окна */}
      {isBannerVisible && !isCourierModalVisible && (
        <Modal
          visible={isBannerVisible}
          onRequestClose={() => {
            setIsBannerVisible(false);
            if (shouldShowCourierModal) {
              if (courierData && courierData.phone) {
                // Если есть номер, сразу звоним
                const phoneNumber = courierData.phone.replace(/\s/g, '');
                Linking.openURL(`tel:${phoneNumber}`);
              } else {
                // Если нет номера, показываем модальное окно
                setIsCourierModalVisible(true);
              }
              setShouldShowCourierModal(false);
            }
          }}
          transparent={true}
          animationType="slide"
        >
          <TouchableOpacity 
            style={styles.modalOverlayBottom} 
            activeOpacity={1} 
            onPress={() => {
              setIsBannerVisible(false);
              if (shouldShowCourierModal) {
                if (courierData && courierData.phone) {
                  // Если есть номер, сразу звоним
                  const phoneNumber = courierData.phone.replace(/\s/g, '');
                  Linking.openURL(`tel:${phoneNumber}`);
                } else {
                  // Если нет номера, показываем модальное окно
                  setIsCourierModalVisible(true);
                }
                setShouldShowCourierModal(false);
              }
            }}
          >
            <TouchableOpacity 
              style={styles.bannerModalContainer} 
              activeOpacity={1} 
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>Важно</Text>
                <Text style={styles.bannerText}>
                  Курьеры назначаются автоматически — по рейтингу и близости к вашему адресу.
                </Text>
                <Text style={styles.bannerText}>
                  📌 Сохранять номер курьера не нужно.
                </Text>
                <Text style={styles.bannerText}>
                  📌 Оформляйте новые заказы только через приложение, чтобы избежать недоразумений.
                </Text>
                <TouchableOpacity 
                  style={styles.bannerButton}
                  onPress={() => {
                    setIsBannerVisible(false);
                    // Если нужно звонить или показать модальное окно после закрытия баннера
                    if (shouldShowCourierModal) {
                      if (courierData && courierData.phone) {
                        // Если есть номер, сразу звоним
                        const phoneNumber = courierData.phone.replace(/\s/g, '');
                        Linking.openURL(`tel:${phoneNumber}`);
                      } else {
                        // Если нет номера, показываем модальное окно
                        setIsCourierModalVisible(true);
                      }
                      setShouldShowCourierModal(false);
                    }
                  }}
                >
                  <Text style={styles.bannerButtonText}>Понятно</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Модальное окно для отмены заказа */}
      <Modal
        visible={isCancelModalVisible}
        onRequestClose={() => setIsCancelModalVisible(false)}
        transparent={true}
        animationType="slide"
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsCancelModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.cancelModalContainer} 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.cancelModalTitle}>Причина отмены заказа</Text>
            <Text style={styles.cancelModalSubtitle}>Выберите причину отмены заказа</Text>
            
            <ScrollView style={styles.cancelReasonsContainer} showsVerticalScrollIndicator={false}>
              {cancelReasons.map((reason) => (
                <TouchableOpacity
                  key={reason.id}
                  style={[
                    styles.cancelReasonCard,
                    selectedCancelReason?.id === reason.id && styles.cancelReasonCardSelected
                  ]}
                  onPress={() => {
                    setSelectedCancelReason(reason);
                    if (reason.id !== 'other') {
                      setOtherReasonText('');
                    }
                  }}
                >
                  <Text style={[
                    styles.cancelReasonText,
                    selectedCancelReason?.id === reason.id && styles.cancelReasonTextSelected
                  ]}>
                    {reason.label}
                  </Text>
                  {selectedCancelReason?.id === reason.id && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedIndicatorText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedCancelReason?.id === 'other' && (
              <View style={styles.otherReasonContainer}>
                <TextInput
                  style={[
                    styles.otherReasonInput,
                    { borderColor: selectedCancelReason?.id === 'other' ? '#DC1818' : 'transparent' }
                  ]}
                  placeholder="Укажите причину отмены"
                  placeholderTextColor="#99A3B3"
                  value={otherReasonText}
                  onChangeText={setOtherReasonText}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            <View style={styles.cancelModalButtons}>
              <TouchableOpacity 
                style={styles.cancelModalCancelButton}
                onPress={() => setIsCancelModalVisible(false)}
              >
                <Text style={styles.cancelModalCancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.cancelModalConfirmButton,
                  !selectedCancelReason?.id && styles.cancelModalConfirmButtonDisabled
                ]}
                onPress={handleConfirmCancel}
                disabled={!selectedCancelReason?.id}
              >
                <Text style={styles.cancelModalConfirmButtonText}>Подтвердить</Text>
              </TouchableOpacity>
            </View>
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
  safeAreaWithBanner: {
    paddingBottom: 180, // Отступ для баннера
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  orderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  orderStatus: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  productItem: {
    marginBottom: 8,
  },
  productText: {
    fontSize: 16,
    color: '#666',
  },
  backButton: {
    backgroundColor: '#DC1818',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#EDEDED',
    marginVertical: 16,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalCallButton: {
    backgroundColor: '#DC1818',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  modalCallButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    borderWidth: 1,
    borderColor: '#DC1818',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#DC1818',
    fontSize: 16,
    fontWeight: '600',
  },
  bannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  bannerModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    width: '100%',
    paddingBottom: 40,
  },
  bannerContainerModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 2000,
  },
  bannerContent: {
    maxWidth: '100%',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  bannerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  bannerButton: {
    backgroundColor: '#DC1818',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  bannerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelModalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  cancelModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  cancelModalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  cancelReasonsContainer: {
    maxHeight: 300,
    marginBottom: 16,
  },
  cancelReasonCard: {
    backgroundColor: '#F6F6F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cancelReasonCardSelected: {
    backgroundColor: '#FFF5F5',
    borderColor: '#DC1818',
  },
  cancelReasonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  cancelReasonTextSelected: {
    color: '#DC1818',
    fontWeight: '600',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DC1818',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  selectedIndicatorText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  otherReasonContainer: {
    marginBottom: 16,
  },
  otherReasonInput: {
    backgroundColor: '#F6F6F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 2,
    borderColor: '#DC1818',
  },
  cancelModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelModalCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DC1818',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelModalCancelButtonText: {
    color: '#DC1818',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelModalConfirmButton: {
    flex: 1,
    backgroundColor: '#DC1818',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelModalConfirmButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.5,
  },
  cancelModalConfirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reviewSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  reviewsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  reviewChip: {
    backgroundColor: '#F6F6F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reviewChipSelected: {
    backgroundColor: '#FFF5F5',
    borderColor: '#DC1818',
  },
  reviewChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  reviewChipTextSelected: {
    color: '#DC1818',
    fontWeight: '600',
  },
  reviewCheckmark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC1818',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  reviewCheckmarkText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  submitReviewButton: {
    backgroundColor: '#DC1818',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitReviewButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  submitReviewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderStatusScreen;