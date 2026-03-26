import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import StableImage from './StableImage';
import { useTopUpBalance } from '../context/TopUpBalanceContext';

interface MainPageWalletProps {
  balance: number;
}

const MainPageWallet: React.FC<MainPageWalletProps> = ({ balance }) => {
  const { openTopUpModal } = useTopUpBalance();
  return (
    <TouchableOpacity style={styles.container} onPress={() => openTopUpModal()}>
      <Text style={styles.title}>Мой кошелек:</Text>
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceText}>{balance} ₸</Text>
        <TouchableOpacity>
            <StableImage source={require('../assets/visibilityIcon.png')} style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEDBDB',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    marginHorizontal: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
  },
  buttonIcon: {
    width: 30,
    height: 30,
  },
});

export default MainPageWallet;