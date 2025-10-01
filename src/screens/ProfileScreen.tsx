import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { NavButton, Navigation } from '../components';
import ButtonWithSwitch from '../components/ButtonWithSwitch';
import { useAuth } from '../hooks';
import { profileImageStorage } from '../utils/storage';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout, loadingState } = useAuth();
  const [notificationSwitchValue, setNotificationSwitchValue] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [language, setLanguage] = useState('Русский');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);

  // Загружаем сохраненное фото профиля при монтировании компонента
  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const savedImageUri = await profileImageStorage.get();
        if (savedImageUri) {
          setProfileImageUri(savedImageUri);
        }
      } catch (error) {
        console.error('Ошибка при загрузке фото профиля:', error);
      }
    };
    loadProfileImage();
  }, []);

  // Проверяем авторизацию пользователя после загрузки
  useEffect(() => {
    if (loadingState === 'success' && !user) {
      navigation.navigate('Login');
    }
  }, [loadingState, user, navigation]);

  // Функция для выбора фото
  const handleSelectPhoto = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 500,
        maxHeight: 500,
      },
      async (response: ImagePickerResponse) => {
        if (response.didCancel) {
          console.log('Пользователь отменил выбор фото');
        } else if (response.errorCode) {
          console.error('Ошибка ImagePicker:', response.errorMessage);
          Alert.alert('Ошибка', 'Не удалось загрузить фото');
        } else if (response.assets && response.assets[0]) {
          const imageUri = response.assets[0].uri;
          if (imageUri) {
            try {
              // Сохраняем URI изображения локально
              await profileImageStorage.save(imageUri);
              setProfileImageUri(imageUri);
              console.log('Фото профиля успешно сохранено');
            } catch (error) {
              console.error('Ошибка при сохранении фото:', error);
              Alert.alert('Ошибка', 'Не удалось сохранить фото');
            }
          }
        }
      }
    );
  };

  // Показываем загрузку пока данные пользователя загружаются
  if (loadingState === 'loading') {
    return <ActivityIndicator size="large" color="#DC1818" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} />;
  }

  // Если пользователь не авторизован после загрузки, не рендерим компонент
  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* <View style={{height: 100}} /> */}
      <View style={styles.header}>
        <View style={{width: 24}} />
        <Text style={styles.profileTitle}>Профиль</Text>
        <TouchableOpacity style={styles.logInOutButton} onPress={() => {
          logout()
          navigation.navigate('Home');
        }}>
          <Image source={require('../assets/logInOut.png')} style={styles.logInOutIcon} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.profileContainer}>
          <View style={styles.profileImageContainer}>
            {profileImageUri ? (
              <Image source={{ uri: profileImageUri }} style={styles.profileImageCustom} />
            ) : (
              <Image source={require('../assets/profileEmptyImage.png')} style={styles.profileImage} />
            )}
          </View>
          <TouchableOpacity style={styles.profileImageButton} onPress={handleSelectPhoto}>
            <Text style={styles.profileImageButtonText}>Изменить{'\n'}фото</Text>
          </TouchableOpacity>
          <Text style={styles.profileName}>{user?.fullName}</Text>
        </View>

        <NavButton title="Изменить данные" onPress={() => navigation.navigate('ChangeData')} icon={require('../assets/edit.png')} />

        <NavButton title="Настройки" onPress={() => navigation.navigate('History')} icon={require('../assets/setting.png')} />
        
        {/* <NavButton title="Бонусы" onPress={() => navigation.navigate('Bonus')} icon={require('../assets/star.png')} /> */}
        
        <NavButton title="Мой кошелек" onPress={() => navigation.navigate('Wallet')} icon={require('../assets/wallet.png')} />

        {/* <NavButton title="Аналитика" onPress={() => navigation.navigate('Bonus')} icon={require('../assets/analytics.png')} /> */}

        {/* <NavButton title="Тарифы" onPress={() => navigation.navigate('Tarrifs')} icon={require('../assets/tarifs.png')} additioinalText="Standard" /> */}

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
  profileImageCustom: {
    width: 95,
    height: 95,
    borderRadius: 100,
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
