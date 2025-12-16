import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
  Modal,
} from 'react-native';
import { Header, MainPageBanner, Navigation } from '../components';
import NavButton from '../components/NavButton';
import { useAuth } from '../hooks';

interface SupportScreenProps {
  navigation?: any;
}

const SupportScreen: React.FC<SupportScreenProps> = ({ navigation }) => {

  const { user } = useAuth();

  const [isModalVisible, setIsModalVisible] = useState(false);
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header 
        bonus={user?.balance || 0} 
        showBackButton={false}
        showBonus={false}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <MainPageBanner navigation={navigation} setIsModalVisible={setIsModalVisible}/>

        <Text style={styles.title}>С чем мы можем вам помочь?</Text>

        <NavButton 
          title="Чат поддержка" 
          onPress={() => {
            if (user) {
              navigation.navigate('Chat');
            } else {
              navigation.navigate('Login');
            }
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
              Linking.openURL('tel:+77475315558');
            }} 
          >
            <Text style={styles.phoneButton}>+7 (747) 531-55-58</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.contactCard}>
          <View style={{width: 80}} />
          <TouchableOpacity 
            onPress={() => {
              Linking.openURL('tel:+77273172737');
            }} 
          >
            <Text style={styles.phoneButton}>+7 (727) 317-27-37</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.contactCard}>
        <View style={{width: 80}} />
          <TouchableOpacity 
            onPress={() => {
              Linking.openURL('tel:+77272378047');
            }} 
          >
            <Text style={styles.phoneButton}>+7 (727) 237-80-47</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Email:</Text>
          <TouchableOpacity 
            onPress={() => {
              Linking.openURL('mailto:support@example.com');
            }} 
          >
            <Text style={styles.emailButton}>info@tibetskaya.kz</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* <Navigation /> */}

      <Modal
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
        transparent={true}
        animationType="slide"
      >
        <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setIsModalVisible(false)}
        >
            <TouchableOpacity 
                style={styles.modalContainer} 
                activeOpacity={1} 
                onPress={(e) => e.stopPropagation()}
            >
                <Text style={{ fontSize: 24, fontWeight: "700"}}>Вызов мастера на дом:</Text>

                <View style={{height: 1, backgroundColor: "#EDEDED", marginVertical: 16}} />

                <Text style={{ fontSize: 18, fontWeight: "600", textAlign: "center"}}>Вызовите мастера и он устранит проблему</Text>

                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttonText}>Позвонить</Text>
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
    paddingHorizontal: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: "relative"
  },
  modalContainer: {
      backgroundColor: 'white',
      padding: 24,
      borderRadius: 8,
      position: "absolute",
      bottom: 0,
      width: "100%",
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      paddingBottom: 40,
  },
  button: {
    backgroundColor: '#DC1818',
    padding: 16,
    borderRadius: 8,
    marginTop: 32,
  },
  buttonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
  },
});

export default SupportScreen;
