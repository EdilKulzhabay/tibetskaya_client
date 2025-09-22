import { SafeAreaView, StyleSheet, ScrollView, Text } from 'react-native';
import { Back } from '../components';
import CollapsibleSection from '../components/CollapsibleSection';

const faq = [
  {
    question: 'Как заказать воду?',
    answer: 'Для заказа воды вам необходимо зарегистрироваться в нашем приложении и выбрать адрес доставки. Затем вы можете выбрать количество и тип воды, которую вы хотите заказать. После этого вам необходимо нажать кнопку "Заказать" и ожидать доставки.',
  },
  {
    question: 'Как получить бонусы?',
    answer: 'Для получения бонусов вам необходимо зарегистрироваться в нашем приложении и выбрать адрес доставки. Затем вы можете выбрать количество и тип воды, которую вы хотите заказать. После этого вам необходимо нажать кнопку "Заказать" и ожидать доставки.',
  },
  {
    question: 'Как потратить бонусы?',
    answer: 'Для потратить бонусы вам необходимо зарегистрироваться в нашем приложении и выбрать адрес доставки. Затем вы можете выбрать количество и тип воды, которую вы хотите заказать. После этого вам необходимо нажать кнопку "Заказать" и ожидать доставки.',
  },
];

const FAQScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Back navigation={navigation} title="FAQ" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {faq.map((item, index) => (
          <CollapsibleSection key={index} title={item.question}>
            <Text style={styles.answer}>{item.answer}</Text>
          </CollapsibleSection>
        ))}
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  answer: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000',
  },
});


export default FAQScreen;