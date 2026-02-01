import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

interface HeaderProps {
  bonus: number;
  paymentMethod?: string;
  coupon?: number;
  // Новые props для раздельного отображения бутылок
  paidBootlesFor19?: number;
  paidBootlesFor12?: number;
  doesItTake19Bottles?: boolean;
  doesItTake12Bottles?: boolean;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  showBonus?: boolean;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Header: React.FC<HeaderProps> = ({
  bonus,
  paymentMethod,
  coupon,
  paidBootlesFor19,
  paidBootlesFor12,
  doesItTake19Bottles,
  doesItTake12Bottles,
  showBonus = false,
}) => {
  const navigation = useNavigation<NavigationProp>();

  const onBonusPress = () => {
    navigation.navigate('Wallet');
  }

  // Функция для отображения баланса бутылок с учетом литража
  const renderCouponBalance = () => {
    const takes19 = doesItTake19Bottles === true;
    const takes12 = doesItTake12Bottles === true;
    const balance19 = paidBootlesFor19 || 0;
    const balance12 = paidBootlesFor12 || 0;

    // Если оба типа бутылок - показываем с литражом
    if (takes19 && takes12) {
      return (
        <View style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.bonusText}>{balance19.toLocaleString()}</Text>
            <Image source={require('../assets/coupon.png')} style={{ width: 24, height: 24 }} />
            <Text style={styles.literText}>18,9 л</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.bonusText}>{balance12.toLocaleString()}</Text>
            <Image source={require('../assets/coupon.png')} style={{ width: 24, height: 24 }} />
            <Text style={styles.literText}>12,5 л</Text>
          </View>
        </View>
      );
    }

    // Если только 19л
    if (takes19 && !takes12) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={styles.bonusText}>{balance19.toLocaleString()}</Text>
          <Image source={require('../assets/coupon.png')} style={{ width: 30, height: 30 }} />
          <Text style={styles.literText}>18,9 л</Text>
        </View>
      );
    }

    // Если только 12л
    if (!takes19 && takes12) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={styles.bonusText}>{balance12.toLocaleString()}</Text>
          <Image source={require('../assets/coupon.png')} style={{ width: 30, height: 30 }} />
          <Text style={styles.literText}>12,5 л</Text>
        </View>
      );
    }

    // Fallback на старый формат (без флагов)
    const totalCoupon = coupon || (balance19 + balance12);
    if (totalCoupon > 0) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={styles.bonusText}>{totalCoupon.toLocaleString()}</Text>
          <Image source={require('../assets/coupon.png')} style={{ width: 30, height: 30 }} />
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <View>
          <Image
            source={require('../assets/mainIcon.png')}
            style={styles.logo}
          />
        </View>

        {showBonus && (
          <TouchableOpacity 
            style={styles.bonusContainer} 
            onPress={onBonusPress} 
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {paymentMethod === 'balance' && (
              <Text style={styles.bonusText}>
                {bonus.toLocaleString()} ₸
              </Text>
            )}

            {paymentMethod === 'coupon' && renderCouponBalance()}

          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'white',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 13,
    backgroundColor: 'white',
  },
  logo: {
    width: 129,
    height: 48,
  },
  bonusContainer: {
  },
  bonusText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#DC1818',
  },
  literText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
});

export default Header;
