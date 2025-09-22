import { SafeAreaView, StyleSheet, View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Back } from '../components';

const WalletScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Back navigation={navigation} title="Мой кошелек" />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceTitle}>Мой кошелек:</Text>
          <View style={styles.balanceContent}>
            <Text style={styles.balanceCount}>1000</Text>
            <Text style={styles.balanceCountT}>₸</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.giveMoreButton}>
            <Text style={styles.giveMoreButtonText}>Пополнить</Text>
        </TouchableOpacity>

        <View style={styles.FAQButtonsContainer}>
            <TouchableOpacity style={styles.FAQButton}>
                <Image source={require('../assets/star.png')} style={styles.FAQImage} />
                <Text style={styles.FAQButtonText}>Что такое{'\n'}мой баланс?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.FAQButton}>
                <Image source={require('../assets/star2.png')} style={styles.FAQImage} />
                <Text style={styles.FAQButtonText}>Как{'\n'}пополнить?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.FAQButton}>
                <Image source={require('../assets/faq.png')} style={styles.FAQImage} />
                <Text style={styles.FAQButtonText}>Вопросы{'\n'}и ответы</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>
      
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