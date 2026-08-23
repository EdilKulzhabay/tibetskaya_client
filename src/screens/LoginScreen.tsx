import React, {useState, useEffect} from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Keyboard,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  BackHandler,
  ScrollView,
} from 'react-native';
import OutlinedFilledLabelInput from '../components/OutlinedFilledLabelInput';
import {apiService} from '../api/services';
import {useAuth} from '../hooks/useAuth';
import {useFocusEffect} from '@react-navigation/native';
import StableImage from '../components/StableImage';
const screenWidth = Dimensions.get('window').width;

const LoginScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const {saveUserData} = useAuth();
  const [loginMethod, setLoginMethod] = useState<'phone' | 'mail'>('phone');
  const [mail, setMail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Отслеживание состояния клавиатуры, чтобы можно было проскроллить к кнопкам под полями
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

  // Обработка кнопки "Назад" на Android
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('Home');
        return true; // Предотвращаем стандартное поведение
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => subscription.remove();
    }, [navigation]),
  );

  const handleLogin = async () => {
    setLoading(true);
    const res = await apiService.clientLogin(
      loginMethod === 'phone'
        ? {phone: phone.trim(), password: password.trim()}
        : {mail: mail.trim(), password: password.trim()},
    );
    if (res.success) {
      // Передаем весь ответ сервера (включая токены)
      setLoading(false);
      await saveUserData(res);
      Alert.alert('Успешно', `Добро пожаловать, ${res.clientData.userName}!`);
      navigation.navigate('Home');
    } else {
      setLoading(false);
      Alert.alert('Ошибка', res.message);
    }
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
        <View>
          {loginMethod === 'phone' ? (
            <OutlinedFilledLabelInput
              label="Номер телефона"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={text => setPhone(text)}
              mask="phone"
              onRightIconPress={() => {}}
            />
          ) : (
            <OutlinedFilledLabelInput
              label="Введите почту"
              keyboardType="email-address"
              value={mail}
              onChangeText={text => setMail(text)}
              onRightIconPress={() => {}}
              autoCapitalize="none"
            />
          )}

          <OutlinedFilledLabelInput
            label="Введите пароль"
            keyboardType="default"
            value={password}
            onChangeText={text => setPassword(text)}
            onRightIconPress={() => {}}
            isPassword={true}
            autoCapitalize="none"
          />

          <TouchableOpacity
            onPress={() =>
              setLoginMethod(loginMethod === 'phone' ? 'mail' : 'phone')
            }
            style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>
              {loginMethod === 'phone'
                ? 'Войти через почту'
                : 'Войти через телефон'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              navigation.navigate('ForgotPassword');
            }}
            style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Забыли пароль?</Text>
          </TouchableOpacity>
        </View>

        <View style={{marginTop: 60}}>
          <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Войти</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('Register');
            }}
            style={styles.registerContainer}>
            <Text style={styles.registerText}>
              Еще нет аккаунта?{' '}
              <Text style={styles.registerLink}>Зарегистрироваться</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    position: 'relative',
    marginTop: -30
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
    flex: 1,
    paddingHorizontal: 24,
    marginTop: 20,
    paddingBottom: 40,
    justifyContent: 'space-between',
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
  loginButton: {
    padding: 16,
    backgroundColor: '#DC1818',
    borderRadius: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 500,
    textAlign: 'center',
  },
});

export default LoginScreen;
