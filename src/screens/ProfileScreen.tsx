import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { NavButton, Navigation } from '../components';
import ButtonWithSwitch from '../components/ButtonWithSwitch';
import { useAuth } from '../hooks';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [notificationSwitchValue, setNotificationSwitchValue] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [language, setLanguage] = useState('Русский');

  if (!user) {
    return <SafeAreaView style={notLoggedIn.safeArea}>
      <Text style={notLoggedIn.text}>Вы не авторизованы</Text>
        <TouchableOpacity style={notLoggedIn.button} onPress={() => navigation.navigate('Login')}>
          <Text style={notLoggedIn.buttonText}>Войти</Text>
        </TouchableOpacity>
        <TouchableOpacity style={notLoggedIn.button} onPress={() => navigation.navigate('Register')}>
          <Text style={notLoggedIn.buttonText}>Зарегистрироваться</Text>
        </TouchableOpacity>
    </SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* <View style={{height: 100}} /> */}
      <View style={styles.header}>
        <View style={{width: 24}} />
        <Text style={styles.profileTitle}>Профиль</Text>
        <TouchableOpacity style={styles.logInOutButton} onPress={() => logout()}>
          <Image source={require('../assets/logInOut.png')} style={styles.logInOutIcon} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.profileContainer}>
          <View style={styles.profileImageContainer}>
            <Image source={require('../assets/profileEmptyImage.png')} style={styles.profileImage} />
          </View>
          <TouchableOpacity style={styles.profileImageButton}>
            <Text style={styles.profileImageButtonText}>Изменить{'\n'}фото</Text>
          </TouchableOpacity>
          <Text style={styles.profileName}>{user.fullName}</Text>
        </View>

        <NavButton title="Изменить данные" onPress={() => navigation.navigate('ChangeData')} icon={require('../assets/edit.png')} />

        <NavButton title="Настройки" onPress={() => navigation.navigate('History')} icon={require('../assets/setting.png')} />
        
        <NavButton title="Бонусы" onPress={() => navigation.navigate('Bonus')} icon={require('../assets/star.png')} />
        
        <NavButton title="Мой кошелек" onPress={() => navigation.navigate('Bonus')} icon={require('../assets/wallet.png')} />

        <NavButton title="Аналитика" onPress={() => navigation.navigate('Bonus')} icon={require('../assets/analytics.png')} />

        <NavButton title="Тарифы" onPress={() => navigation.navigate('Tarrifs')} icon={require('../assets/tarifs.png')} additioinalText="Standard" />

        <View style={{width: '100%', height: 1, backgroundColor: '#ECECEC', marginVertical: 12}} />

        <NavButton title="Адрес доставки" onPress={() => navigation.navigate('Address')} icon={require('../assets/location.png')} />

        <NavButton title="Язык" onPress={() => setLanguageModalVisible(true)} icon={require('../assets/language.png')}  additioinalText={language}/>

        <ButtonWithSwitch title="Уведомления" icon={require('../assets/notification.png')} switchValue={notificationSwitchValue} onSwitchChange={() => setNotificationSwitchValue(!notificationSwitchValue)} />

        <View style={{height: 120}} />
      </ScrollView>
      <Navigation />

      <Modal
        visible={languageModalVisible}
        onRequestClose={() => {}}
        transparent={true}
        animationType="fade"
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setLanguageModalVisible(false)}>
          <TouchableOpacity style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
            <Text>Выберите язык</Text>
            <View style={{height: 1, backgroundColor: "#EDEDED", marginVertical: 16}} />
            <TouchableOpacity style={styles.modalButton}>
              <Text>Русский</Text>
              <View style={{ justifyContent: 'center', alignItems: 'center', width: 16, height: 16, borderRadius: "50%", borderWidth: 1, borderColor: language === 'Русский' ? '#DC1818' : '#101010' }}>
                {language === 'Русский' && <View style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: '#DC1818' }} />}
              </View>
            </TouchableOpacity>
            {/* <TouchableOpacity style={styles.modalButton}>
              <Text>Казахский</Text>
              <View style={{ justifyContent: 'center', alignItems: 'center', width: 16, height: 16, borderRadius: "50%", borderWidth: 1, borderColor: language === 'Казахский' ? '#DC1818' : '#101010' }}>
                {language === 'Казахский' && <View style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: '#DC1818' }} />}
              </View>
            </TouchableOpacity> */}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const notLoggedIn = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#292D32',
  },
  button: {
    padding: 12,
    backgroundColor: '#DC1818',
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    padding: 24,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 13,
    backgroundColor: 'white',
  },
  logInOutButton: {
    padding: 8,
  },
  logInOutIcon: {
    width: 24,
    height: 24,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: "#292D32"
  },
  profileContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  profileImageContainer: {
    padding: 25,
    backgroundColor: 'white',
    borderRadius: 100,
  },
  profileImage: {
    width: 45,
    height: 45,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '500',
  },
  profileImageButton: {
  },
  profileImageButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC1818',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 8,
    width: '80%',
  },
  modalButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EDEDED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#101010',
  },
});

export default ProfileScreen;
