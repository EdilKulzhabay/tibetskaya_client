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
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  showBonus?: boolean;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Header: React.FC<HeaderProps> = ({
  bonus,
  showBonus = false,
}) => {
  const navigation = useNavigation<NavigationProp>();

  const onBonusPress = () => {
    navigation.navigate('Wallet');
  }

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
            <Text style={styles.bonusText}>
              {bonus.toLocaleString()} ₸
            </Text>
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
});

export default Header;
