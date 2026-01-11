import { SafeAreaView, StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, Modal, Alert } from 'react-native';
import { Back } from '../components';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import { apiService } from '../api/services';
import OutlinedFilledLabelInput from '../components/OutlinedFilledLabelInput';
import { Linking } from 'react-native';

const WalletScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [modal, setModal] = useState(false)
  const [sum, setSum] = useState("0")

  const handlePayment = async() => {
    if (sum === "0" || sum === "" || isNaN(Number(sum))) {
      Alert.alert('Ошибка', 'Сумма пополнения не может быть 0 или не числом')
      return
    }
    const response = await apiService.createPaymentLink(sum)
    if (response.success) {
      Linking.openURL(response.paymentUrl)
      setModal(false)
    } else {
      Alert.alert('Ошибка', response.message)
      setModal(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Back navigation={navigation} title="Мой кошелек" />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceTitle}>Мой кошелек:</Text>
          <View style={styles.balanceContent}>
            <Text style={styles.balanceCount}>{user?.balance || 0}</Text>
            <Text style={styles.balanceCountT}>₸</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => {setModal(true)}} style={styles.giveMoreButton}>
            <Text style={styles.giveMoreButtonText}>Пополнить</Text>
        </TouchableOpacity>

        <View style={styles.FAQButtonsContainer}>
            <TouchableOpacity style={styles.FAQButton} onPress={() => navigation.navigate('WhatIsMyBalance')}>
                <Image source={require('../assets/star.png')} style={styles.FAQImage} />
                <Text style={styles.FAQButtonText}>Что такое{'\n'}мой баланс?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.FAQButton} onPress={() => navigation.navigate('HowToTopUp')}>
                <Image source={require('../assets/star2.png')} style={styles.FAQImage} />
                <Text style={styles.FAQButtonText}>Как{'\n'}пополнить?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.FAQButton} onPress={() => navigation.navigate('FAQ')}>
                <Image source={require('../assets/faq.png')} style={styles.FAQImage} />
                <Text style={styles.FAQButtonText}>Вопросы{'\n'}и ответы</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>
      
      <Modal visible={modal} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalContainer} onPress={() => setModal(false)}>
          <TouchableOpacity style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <OutlinedFilledLabelInput
                label="Сумма пополнения"
                value={sum}
                onChangeText={(text) => setSum(text)}
                bgWhite={true}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 12 }}>
              {[2600, 5000, 10000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  onPress={() => setSum(amount.toString())}
                  style={{
                    backgroundColor: sum === amount.toString() ? '#DC1818' : '#fff',
                    borderRadius: 18,
                    paddingHorizontal: 18,
                    paddingVertical: 8,
                    borderWidth: sum === amount.toString() ? 2 : 1,
                    borderColor: sum === amount.toString() ? '#DC1818' : '#E3E3E3',
                  }}
                >
                  <Text style={{
                    color: sum === amount.toString() ? '#fff' : '#111',
                    fontWeight: '600',
                  }}>
                    {amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.giveMoreButton} onPress={handlePayment}>
              <Text style={styles.giveMoreButtonText}>Пополнить</Text>
            </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal:20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  balanceContainer: {
    backgroundColor: '#FEDBDB',
    borderRadius: 16,
    padding: 16,
  },
  balanceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  balanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  balanceCount: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000',
  },
  balanceCountT: {
    fontSize: 32,
    fontWeight: '400',
    color: '#000',
  },
  giveMoreButton: {
    marginTop: 16,
    backgroundColor: '#DC1818',
    borderRadius: 8,
    padding: 16,
    width: '100%',
  },
  giveMoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  FAQButtonsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-between',
    alignItems: "stretch"
  },
  FAQButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    width: '30.33%',
    justifyContent: 'space-between',
  },
  FAQImage: {
    width: 24,
    height: 24,
  },
  FAQButtonText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
});

export default WalletScreen;