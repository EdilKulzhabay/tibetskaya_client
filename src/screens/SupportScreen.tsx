import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Header, MainPageBanner, Navigation } from '../components';
import NavButton from '../components/NavButton';

interface SupportScreenProps {
  navigation?: any;
}

const SupportScreen: React.FC<SupportScreenProps> = ({ navigation }) => {
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header 
        bonus="50" 
        showBackButton={false}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <MainPageBanner navigation={navigation} />

        <Text style={styles.title}>С чем мы можем вам помочь?</Text>

        <NavButton 
          title="Чат поддержка" 
          onPress={() => {
            navigation.navigate('Chat');
          }}
          icon={require('../assets/chat.png')} 
        />

        <NavButton 
          title="Частые вопросы" 
          onPress={() => {
            navigation.navigate('FAQ');
          }}
          icon={require('../assets/faq.png')} 
        />

        <Text style={styles.title}>Контакты:</Text>
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Телефон:</Text>
          <TouchableOpacity 
            onPress={() => {
              Linking.openURL('tel:+77771234567');
            }} 
          >
            <Text style={styles.phoneButton}>+7 (777) 123-45-67</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Email:</Text>
          <TouchableOpacity 
            onPress={() => {
              Linking.openURL('mailto:support@example.com');
            }} 
          >
            <Text style={styles.emailButton}>support@example.com</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <Navigation />
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
  },
  title: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#101010',
  },
  contactCard: {
    marginTop: 6,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000',
  },
  phoneButton: {
    color: '#DC1818',
    fontSize: 16
  },
  emailButton: {
    color: '#DC1818',
    fontSize: 16
  },
});

export default SupportScreen;
