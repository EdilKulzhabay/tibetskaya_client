import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Keyboard,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import OutlinedFilledLabelInput from '../components/OutlinedFilledLabelInput';
import {useEffect, useRef, useState} from 'react';
import {MySwitchToggle, StableImage} from '../components';
import {apiService} from '../api/services';
import {formatReferralCodeInput} from '../utils/referral';
const screenWidth = Dimensions.get('window').width;

const RegisterScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const [form, setForm] = useState({
    userName: '',
    mail: '',
    phone: '',
    referralCode: '',
    termsAccepted: false,
    privacyAccepted: false,
  });
  const [loading, setLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Refs для навигации между полями
  const nameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const referralRef = useRef<TextInput>(null);

  // Отслеживание состояния клавиатуры
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      event => {
        setIsKeyboardVisible(true);
        setKeyboardHeight(event.endCoordinates.height);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleRegister = async () => {
    if (!form.userName || !form.phone) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
      return;
    }
    if (form.phone.replace(/\D/g, '').length !== 11) {
      Alert.alert('Ошибка', 'Введите полный номер телефона');
      return;
    }
    if (!form.termsAccepted || !form.privacyAccepted) {
      Alert.alert(
        'Ошибка',
        'Пожалуйста, примите условия обслуживания и политику конфиденциальности',
      );
      return;
    }
    setLoading(true);
    const nextForm = {
      ...form,
      mail: form.mail.trim(),
      userName: form.userName.trim(),
      phone: form.phone.trim(),
      referralCode: form.referralCode.trim().toUpperCase(),
    };
    setForm(nextForm);
    try {
      const res = await apiService.sendCode(nextForm.mail, nextForm.phone);
      if (res.success) {
        navigation.navigate('Otp', {data: nextForm});
      } else {
        Alert.alert(
          'Ошибка',
          (res as {message?: string}).message || 'Не удалось отправить код',
        );
      }
    } catch (err: unknown) {
      const msg =
        (err as {response?: {data?: {message?: string}}})?.response?.data
          ?.message || 'Не удалось отправить код';
      Alert.alert('Ошибка', msg);
    }
    setLoading(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: isKeyboardVisible ? keyboardHeight + 40 : 40,
      }}>
      <TouchableOpacity
        onPress={() => {
          navigation.goBack();
        }}
        style={{
          padding: 8,
          backgroundColor: '#EFEFEF',
          borderRadius: 8,
          position: 'absolute',
          top: 30,
          left: 16,
          zIndex: 1000,
        }}>
        <StableImage
          source={require('../assets/arrowBack.png')}
          style={{width: 24, height: 24}}
        />
      </TouchableOpacity>
      <View style={styles.bannerContainer}>
        <Image
          source={require('../assets/loginBanner.png')}
          style={{height: screenWidth / 1.76}}
          resizeMode="contain"
        />
      </View>

      <View style={styles.headerContainer}>
        <Text style={styles.title}>Добро пожаловать!</Text>
        <Text style={styles.subtitle}>Введите данные, чтобы продолжить</Text>
      </View>

      <View style={styles.contentContainer}>
        <OutlinedFilledLabelInput
          label="Имя и фамилия"
          value={form.userName}
          onChangeText={text => setForm({...form, userName: text})}
          bgWhite={true}
          inputRef={nameRef}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => phoneRef.current?.focus()}
        />

        <OutlinedFilledLabelInput
          label="Номер телефона"
          keyboardType="name-phone-pad"
          value={form.phone}
          onChangeText={text => setForm({...form, phone: text})}
          mask="phone"
          onRightIconPress={() => {}}
          bgWhite={true}
          inputRef={phoneRef}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => referralRef.current?.focus()}
        />

        <OutlinedFilledLabelInput
          label="Реферальный код (необязательно)"
          value={form.referralCode}
          onChangeText={text =>
            setForm({...form, referralCode: formatReferralCodeInput(text)})
          }
          bgWhite={true}
          inputRef={referralRef}
          returnKeyType="done"
          blurOnSubmit={true}
          autoCapitalize="characters"
          autoCorrect={false}
          onSubmitEditing={handleRegister}
        />

        <View style={styles.agreementRow}>
          <View>
            <Text style={styles.agreementText}>Я согласен с </Text>
            <TouchableOpacity
              onPress={() =>
                Linking.openURL('https://tibetskaya.kz/publicOffer')
              }>
              <Text style={styles.agreementLink}>Условиями обслуживания</Text>
            </TouchableOpacity>
          </View>
          <MySwitchToggle
            value={form.termsAccepted}
            onPress={() =>
              setForm({...form, termsAccepted: !form.termsAccepted})
            }
          />
        </View>

        <View style={styles.agreementRow}>
          <View>
            <Text style={styles.agreementText}>Я согласен с </Text>
            <TouchableOpacity
              onPress={() =>
                Linking.openURL('https://tibetskaya.kz/privacyPolicy')
              }>
              <Text style={styles.agreementLink}>
                Политикой конфиденциальности
              </Text>
            </TouchableOpacity>
          </View>
          <MySwitchToggle
            value={form.privacyAccepted}
            onPress={() =>
              setForm({...form, privacyAccepted: !form.privacyAccepted})
            }
          />
        </View>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleRegister}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>Зарегистрироваться</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    position: 'relative',
    marginTop: -30,
  },
  bannerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  headerContainer: {
    marginTop: 38,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.4,
  },
  contentContainer: {
    paddingHorizontal: 24,
    marginTop: 20,
    paddingBottom: 40,
    // minHeight: Dimensions.get('window').height - (screenWidth / 1.76 + 38 + 24 + 20)
  },
  forgotPassword: {
    marginTop: 5,
    alignItems: 'flex-end',
  },
  forgotPasswordText: {
    color: '#DC1818',
    fontWeight: '500',
    fontSize: 14,
  },
  registerContainer: {
    marginTop: 20,
  },
  registerText: {
    color: 'black',
    textAlign: 'center',
    fontSize: 16,
  },
  registerLink: {
    color: '#DC1818',
    fontWeight: '500',
  },
  registerButton: {
    marginTop: 40,
    padding: 16,
    backgroundColor: '#DC1818',
    borderRadius: 8,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 500,
    textAlign: 'center',
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  agreementText: {
    width: '60%',
  },
  agreementLink: {
    color: 'blue',
  },
});

export default RegisterScreen;
