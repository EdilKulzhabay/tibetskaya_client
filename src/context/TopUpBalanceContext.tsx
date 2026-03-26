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
  StyleSheet,
  Platform,
  Alert,
  InteractionManager,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import PaymentWebView from '../components/PaymentWebView';

type TopUpBalanceContextValue = {
  openTopUpModal: (initialSum?: string) => void;
};

const TopUpBalanceContext = createContext<TopUpBalanceContextValue | null>(null);

export function useTopUpBalance(): TopUpBalanceContextValue {
  const ctx = useContext(TopUpBalanceContext);
  if (!ctx) {
    throw new Error('useTopUpBalance должен использоваться внутри TopUpBalanceProvider');
  }
  return ctx;
}

export const TopUpBalanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUserData } = useAuth();
  const [topUpVisible, setTopUpVisible] = useState(false);
  const [topUpSum, setTopUpSum] = useState('');
  const [paymentWebViewVisible, setPaymentWebViewVisible] = useState(false);
  const [paymentWebViewAmount, setPaymentWebViewAmount] = useState(0);
  const topUpBackdropSafeRef = useRef(true);

  const openTopUpModal = useCallback((initialSum?: string) => {
    if (initialSum !== undefined) {
      setTopUpSum(initialSum);
    } else {
      setTopUpSum('');
    }
    topUpBackdropSafeRef.current = false;
    setTopUpVisible(true);
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        topUpBackdropSafeRef.current = true;
      }, 500);
    });
  }, []);

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
      if (paymentCompleted) {
        refreshUserData();
      }
    },
    [refreshUserData]
  );

  const handleTopUpSavedCard = useCallback(() => {
    handleTopUpNewCard();
  }, [handleTopUpNewCard]);

  const hasSavedCard = !!(user?.savedCard?.cardToken && user?.savedCard?.cardId);
  const cardLast4 = user?.savedCard?.cardPan || '****';

  const value = useMemo(() => ({ openTopUpModal }), [openTopUpModal]);

  return (
    <TopUpBalanceContext.Provider value={value}>
      {children}
      <PaymentWebView
        visible={paymentWebViewVisible}
        onClose={handlePaymentWebViewClose}
        amount={paymentWebViewAmount}
        userId={user?._id || ''}
        userEmail={user?.mail}
        userPhone={user?.phone}
      />
      <Modal
        visible={topUpVisible}
        onRequestClose={() => setTopUpVisible(false)}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={Platform.OS === 'android'}
        presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
      >
        <TouchableOpacity
          style={styles.bottomSheetOverlay}
          activeOpacity={1}
          onPress={() => {
            if (topUpBackdropSafeRef.current) {
              setTopUpVisible(false);
            }
          }}
        >
          <TouchableOpacity
            style={styles.bottomSheetContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.bottomSheetHandle} />
            <Text style={styles.bottomSheetTitle}>Пополнение баланса</Text>

            <View style={styles.bottomSheetBalanceRow}>
              <Text style={styles.bottomSheetBalanceLabel}>Текущий баланс:</Text>
              <Text style={styles.bottomSheetBalanceValue}>
                {Number(user?.balance || 0).toLocaleString('ru-RU')} ₸
              </Text>
            </View>

            <TextInput
              style={styles.bottomSheetInput}
              value={topUpSum}
              onChangeText={setTopUpSum}
              placeholder="Сумма пополнения"
              keyboardType="numeric"
              placeholderTextColor="#99A3B3"
            />

            <View style={styles.bottomSheetQuickAmounts}>
              {[2600, 5000, 10000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  onPress={() => setTopUpSum(amount.toString())}
                  style={[
                    styles.bottomSheetQuickBtn,
                    topUpSum === amount.toString() && styles.bottomSheetQuickBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.bottomSheetQuickBtnText,
                      topUpSum === amount.toString() && styles.bottomSheetQuickBtnTextActive,
                    ]}
                  >
                    {amount.toLocaleString('ru-RU')} ₸
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {hasSavedCard ? (
              <>
                <TouchableOpacity style={styles.bottomSheetPayBtn} onPress={handleTopUpSavedCard}>
                  <Text style={styles.bottomSheetPayBtnText}>
                    Оплатить картой •••• {cardLast4}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomSheetNewCardBtn} onPress={handleTopUpNewCard}>
                  <Text style={styles.bottomSheetNewCardBtnText}>Оплатить другой картой</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.bottomSheetPayBtn} onPress={handleTopUpNewCard}>
                <Text style={styles.bottomSheetPayBtnText}>Пополнить</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
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
    backgroundColor: '#F8F8F8',
    marginBottom: 12,
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
    backgroundColor: '#DC1818',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  bottomSheetPayBtnText: {
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
});
