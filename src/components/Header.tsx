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
  bonus: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Header: React.FC<HeaderProps> = ({
  bonus,
}) => {
  const navigation = useNavigation<NavigationProp>();

  const onBonusPress = () => {
    navigation.navigate('Bonus');
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

        {/* <TouchableOpacity style={styles.bonusContainer} onPress={onBonusPress}>
          <Text style={styles.bonusText}>
            {bonus}
          </Text>
          <Image
            source={require('../assets/bonusIcon.png')}
            style={styles.bonusIcon}
          />
        </TouchableOpacity> */}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bonusIcon: {
    width: 24,
    height: 24,
  },
  bonusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC1818',
  },
});

export default Header;
