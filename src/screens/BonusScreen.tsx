import { SafeAreaView, StyleSheet, View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Back } from '../components';

const BonusScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Back navigation={navigation} title="Бонусы" />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceTitle}>Баланс:</Text>
          <View style={styles.balanceContent}>
            <Text style={styles.balanceCount}>1000</Text>
            <Image source={require('../assets/bonusIcon.png')} style={styles.balanceIcon} />
          </View>
        </View>

        <TouchableOpacity style={styles.giveMoreButton}>
            <Text style={styles.giveMoreButtonText}>Получить больше</Text>
        </TouchableOpacity>

        <View style={styles.FAQButtonsContainer}>
            <TouchableOpacity style={styles.FAQButton}>
                <Image source={require('../assets/star.png')} style={styles.FAQImage} />
                <Text style={styles.FAQButtonText}>Что такое {'\n'}Бонусы?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.FAQButton}>
                <Image source={require('../assets/star2.png')} style={styles.FAQImage} />
                <Text style={styles.FAQButtonText}>Как{'\n'}потратить?</Text>
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
    backgroundColor: 'white',
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
    justifyContent: 'space-between',
  },
  balanceCount: {
    fontSize: 32,
    fontWeight: '600',
    color: '#DC1818',
  },
  balanceIcon: {
    width: 24,
    height: 24,
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

export default BonusScreen;