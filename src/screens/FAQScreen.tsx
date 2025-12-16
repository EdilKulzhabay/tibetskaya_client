import { SafeAreaView, StyleSheet, ScrollView, Text } from 'react-native';
import { Back } from '../components';
import CollapsibleSection from '../components/CollapsibleSection';
import { useState, useEffect } from 'react';
import { apiService } from '../api/services';


const FAQScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [faq, setFaq] = useState<any[]>([]);

  useEffect(() => {
    const fetchFaq = async () => {
      const res = await apiService.getFaq();
      console.log(res);
      setFaq(res.faq);
    };
    fetchFaq();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Back navigation={navigation} title="FAQ" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {faq && faq.length > 0 && faq.map((item, index) => (
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