import React from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigation';
import {useTopUpBalance} from '../context/TopUpBalanceContext';

interface HeaderProps {
  bonus: number;
  paymentMethod?: string;
  coupon?: number;
  /** Цена за бутыль 18,9 л клиента — используется для расчёта "хватит на N бут." */
  price19?: number;
  // Новые props для раздельного отображения бутылок
  paidBootlesFor19?: number;
  paidBootlesFor12?: number;
  doesItTake19Bottles?: boolean;
  doesItTake12Bottles?: boolean;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  showBonus?: boolean;
  onBonusPress?: () => void;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Header: React.FC<HeaderProps> = ({
  bonus,
  paymentMethod,
  coupon,
  price19 = 1500,
  paidBootlesFor19,
  paidBootlesFor12,
  doesItTake19Bottles,
  doesItTake12Bottles,
  showBonus = false,
  onBonusPress: onBonusPressExternal,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const {openTopUpModal} = useTopUpBalance();

  const onBonusPress = () => {
    if (onBonusPressExternal) {
      onBonusPressExternal();
    } else {
      openTopUpModal();
    }
  };

  // Функция для отображения баланса бутылок с учетом литража
  const renderCouponBalance = () => {
    const takes19 = true;
    const takes12 = true;
    const balance19 = paidBootlesFor19 || 0;
    const balance12 = paidBootlesFor12 || 0;

    // Если оба типа бутылок - показываем с литражом
    if (takes19 && takes12) {
      return (
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <View
            style={{flexDirection: 'column', alignItems: 'flex-end', gap: 2}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              <Text style={styles.bonusText}>{balance19.toLocaleString()}</Text>
              <Image
                source={require('../assets/coupon.png')}
                style={{width: 24, height: 24}}
              />
              <Text style={styles.literText}>18,9 л</Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              <Text style={styles.bonusText}>{balance12.toLocaleString()}</Text>
              <Image
                source={require('../assets/coupon.png')}
                style={{width: 24, height: 24}}
              />
              <Text style={styles.literText}>12,5 л</Text>
            </View>
          </View>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#DC1818',
              borderRadius: 6,
              padding: 6,
            }}>
            <Image
              source={require('../assets/whitePlus.png')}
              style={{width: 14, height: 14}}
            />
          </View>
        </View>
      );
    }

    // Если только 19л
    if (takes19 && !takes12) {
      return (
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <Text style={styles.bonusText}>{balance19.toLocaleString()}</Text>
          <Image
            source={require('../assets/coupon.png')}
            style={{width: 30, height: 30}}
          />
          <Text style={styles.literText}>18,9 л</Text>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#DC1818',
              borderRadius: 6,
              padding: 6,
            }}>
            <Image
              source={require('../assets/whitePlus.png')}
              style={{width: 14, height: 14}}
            />
          </View>
        </View>
      );
    }

    // Если только 12л
    if (!takes19 && takes12) {
      return (
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <Text style={styles.bonusText}>{balance12.toLocaleString()}</Text>
          <Image
            source={require('../assets/coupon.png')}
            style={{width: 30, height: 30}}
          />
          <Text style={styles.literText}>12,5 л</Text>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#DC1818',
              borderRadius: 6,
              padding: 6,
            }}>
            <Image
              source={require('../assets/whitePlus.png')}
              style={{width: 14, height: 14}}
            />
          </View>
        </View>
      );
    }

    // Fallback на старый формат (без флагов)
    const totalCoupon = coupon || balance19 + balance12;
    if (totalCoupon > 0) {
      return (
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
          <Text style={styles.bonusText}>{totalCoupon.toLocaleString()}</Text>
          <Image
            source={require('../assets/coupon.png')}
            style={{width: 30, height: 30}}
          />
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#DC1818',
              borderRadius: 6,
              padding: 6,
            }}>
            <Image
              source={require('../assets/whitePlus.png')}
              style={{width: 14, height: 14}}
            />
          </View>
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
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            activeOpacity={0.7}>
            {paymentMethod === 'coupon' ? (
              renderCouponBalance() ?? <Text style={styles.bonusText}>0</Text>
            ) : (
              <View
                style={{marginTop: Math.trunc(bonus / price19) > 0 ? 10 : 0}}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}>
                  <View>
                    <Text
                      style={{fontSize: 8, fontWeight: '400', color: '#000'}}>
                      Баланс
                    </Text>
                    <Text style={styles.bonusText}>
                      {bonus.toLocaleString()} ₸
                    </Text>
                  </View>
                  <View
                    style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: '#DC1818',
                      borderRadius: 6,
                      padding: 6,
                    }}>
                    <Image
                      source={require('../assets/whitePlus.png')}
                      style={{width: 14, height: 14}}
                    />
                  </View>
                </View>
                {Math.trunc(bonus / price19) > 0 && (
                  <View
                    style={{
                      marginTop: 4,
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#9CA3AF',
                      borderRadius: 4,
                      paddingHorizontal: 4,
                      paddingVertical: 2,
                    }}>
                    <View
                      style={{
                        borderWidth: 1,
                        borderColor: '#1bc839',
                        borderRadius: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 1,
                      }}>
                      <Image
                        source={require('../assets/greenCheck.png')}
                        style={{width: 10, height: 10}}
                      />
                    </View>
                    <Text style={{marginLeft: 4, fontSize: 10}}>
                      Хватит на{' '}
                      <Text style={{fontWeight: 500}}>
                        {Math.trunc(bonus / price19)}
                      </Text>{' '}
                      бут.
                    </Text>
                  </View>
                )}
              </View>
            )}
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
  bonusContainer: {},
  bonusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  literText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
  },
});

export default Header;
