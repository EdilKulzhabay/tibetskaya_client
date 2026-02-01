import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { OrderData } from '../types/navigation';
import CollapsibleSection from './CollapsibleSection';

interface AwaitingOrderViewProps {
  order: OrderData;
  onCancelOrder: () => void;
  onCallCourier: () => void;
  navigation: any;
}

const AwaitingOrderView: React.FC<AwaitingOrderViewProps> = ({ order, onCancelOrder, onCallCourier, navigation }) => {
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // 25 минут в секундах

  useEffect(() => {
    console.log("order in AwaitingScreen = ", order)
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = Math.max(0.1, (25 * 60 - timeRemaining) / (25 * 60)); // минимум 10% прогресса

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ваш заказ принят!</Text>
        <Text style={styles.headerSubtitle}>
          Отслеживайте статус заказа в{'\n'}приложении
        </Text>
      </View>

      {/* Timer and Progress */}
      <View style={styles.timerContainer}>
        <View style={styles.timerIconContainer}>
          <View style={styles.timerIcon}>
            <View style={styles.timerCircle}>
              <Text style={styles.timerText}>⏰</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressLabel, progress > 0.1 && styles.progressLabelActive]}>
              В очереди
            </Text>
            <Text style={[styles.progressLabel, progress > 0.8 && styles.progressLabelActive]}>
              Доставляется
            </Text>
          </View>
        </View>
      </View>

      {/* Order Details - Always expanded first */}
      <View style={styles.detailsContainer}>
        {/* Products Section - Collapsible */}
        <CollapsibleSection 
          title="Детали заказа"
          defaultExpanded={true}
          containerStyle={styles.sectionContainer}
        >
          {order.products.b12 > 0 && (
            <View style={styles.productRow}>
              <View style={styles.productInfo}>
                <Text style={styles.productText}>Вода 12,5 л</Text>
                <Text style={styles.productSubtext}>Негазированная</Text>
              </View>
              <Text style={styles.productQuantity}>
                x{order.products.b12}
              </Text>
            </View>
          )}
          {order.products.b19 > 0 && (
            <View style={styles.productRow}>
              <View style={styles.productInfo}>
                <Text style={styles.productText}>Вода 19 л</Text>
                <Text style={styles.productSubtext}>Негазированная</Text>
              </View>
              <Text style={styles.productQuantity}>
                x{order.products.b19}
              </Text>
            </View>
          )}
        </CollapsibleSection>

        {/* Delivery Info Section - Collapsible */}
        <CollapsibleSection 
          title="Информация о доставке"
          defaultExpanded={false}
          containerStyle={styles.sectionContainer}
        >
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Адрес</Text>
            <Text style={styles.infoValue}>
              {order.address?.actual || order.address?.name || 'Самал-1'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Способ оплаты</Text>
            <Text style={styles.infoValue}>
              {order.opForm === "fakt" ? "Нал_Карта_QR" : (order.opForm === "credit" || order.opForm === "coupon") ? "С баланса" : 'Нал_Карта_QR'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Время доставки</Text>
            <Text style={styles.infoValue}>
              {order.date?.d || order.deliveryTime || 'Пятница, 18 апреля'}
            </Text>
          </View>
          
          {(order.sum || order.totalAmount) && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Сумма заказа</Text>
              <Text style={styles.infoValue}>
                {order.sum || order.totalAmount} ₸
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.callCourierButton} onPress={onCallCourier}>
            <Text style={styles.callCourierButtonText}>Позвонить курьеру</Text>
          </TouchableOpacity>
        </CollapsibleSection>

        {/* Support Section - Collapsible */}
        <CollapsibleSection 
          title="Поддержка"
          defaultExpanded={false}
          containerStyle={styles.sectionContainer}
        >
          <TouchableOpacity style={styles.supportButton} onPress={() => navigation.navigate('Chat')}>
            <View style={styles.supportIcon}>
              <Text style={styles.supportIconText}>?</Text>
            </View>
            <Text style={styles.supportText}>Возникли проблемы с заказом?</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </CollapsibleSection>

        {/* Cancel Button - Outside sections */}
        <TouchableOpacity style={styles.cancelButton} onPress={onCancelOrder}>
          <Text style={styles.cancelButtonText}>Отменить заказ</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  timerIconContainer: {
    marginBottom: 30,
  },
  timerIcon: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCircle: {
    width: 100,
    height: 100,
    backgroundColor: '#FFE5E5',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#DC1818',
  },
  timerText: {
    fontSize: 40,
  },
  progressContainer: {
    width: '80%',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#DC1818',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#999',
  },
  progressLabelActive: {
    color: '#DC1818',
    fontWeight: '600',
  },
  detailsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  productText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  productQuantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
    flex: 1,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  supportIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#DC1818',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  supportIconText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  supportText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  chevron: {
    fontSize: 20,
    color: '#C7C7CC',
  },
  cancelButton: {
    borderWidth: 2,
    borderColor: '#DC1818',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
    backgroundColor: 'white',
  },
  cancelButtonText: {
    color: '#DC1818',
    fontSize: 16,
    fontWeight: '600',
  },
  callCourierButton: {
    borderWidth: 2,
    borderColor: '#DC1818',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  callCourierButtonText: {
    color: '#DC1818',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AwaitingOrderView;
