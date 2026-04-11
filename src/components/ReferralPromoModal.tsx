import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Share,
  Platform,
} from 'react-native';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  referralCode: string;
};

const ReferralPromoModal: React.FC<Props> = ({ visible, onDismiss, referralCode }) => {
  const invite = async () => {
    const msg = `Присоединяйся к «Тибетской воде»! Мой реферальный код: ${referralCode}`;
    try {
      const result = await Share.share(
        Platform.OS === 'ios'
          ? { message: msg }
          : { message: msg, title: 'Тибетская вода' }
      );
      if (result?.action === Share.sharedAction) {
        onDismiss();
      }
    } catch {
      /* пользователь отменил */
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <Image source={require('../assets/refPresent.png')} style={styles.image} resizeMode="contain" />
            <Text style={styles.title}>Увеличь свой баланс!</Text>
            <Text style={styles.subtitle}>Поделитесь приложением с другом и получите бонусы</Text>
            <Text style={styles.body}>
              Отправьте ваш уникальный реферальный код. Когда ваш друг сделает первый заказ, мы начислим
              1000 ₸ на ваш баланс. Это выгодно для обоих!
            </Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{referralCode || '—'}</Text>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={invite}>
              <Text style={styles.primaryBtnText}>Пригласить друга</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onDismiss}>
              <Text style={styles.secondaryBtnText}>Пропустить</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 400,
  },
  scroll: {
    padding: 20,
    alignItems: 'center',
  },
  image: {
    width: 60,
    height: 60,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#101010',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#292D32',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
    textAlign: 'center',
    marginBottom: 16,
  },
  codeBox: {
    backgroundColor: '#F6F6F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
    width: '100%',
  },
  codeText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#101010',
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: '#DC1818',
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryBtn: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default ReferralPromoModal;
