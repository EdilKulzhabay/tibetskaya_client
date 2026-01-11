/**
 * Главный компонент приложения
 * @format
 */

import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AuthWrapper from './src/components/AuthWrapper';
import ImagePreloader from './src/components/ImagePreloader';

// Импорт наших экранов
import {
  HomeScreen, 
  ProfileScreen, 
  HistoryScreen, 
  SupportScreen, 
  OrderStatusScreen, 
  BonusScreen,
  WalletScreen, 
  ChatScreen, 
  AddressScreen, 
  AddOrUpdateAddress, 
  LoginScreen, 
  RegisterScreen, 
  RegisterAcceptedScreen, 
  OtpScreen,
  ChangeDataScreen,
  TarrifsScreen,
  FAQScreen,
  HydrationScreen,
  TakePartHydrationScreen,
  TakePartInviteScreen,
  StartHydrationScreen,
  StartHydrationScreen2,
  AddOrderScreen,
  SettingsScreen,
  WhatIsMyBalanceScreen,
  HowToTopUpScreen,
  DeleteAccountScreen,
  ForgotPasswordScreen,
  OtpForgotPasswordScreen,
  NewPasswordScreen
} from './src/screens';
import { RootStackParamList } from './src/types/navigation';
import { ScreenLayout } from './src/components';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Функция-обертка для экранов с навигацией
const withLayout = (Component: React.ComponentType<any>, showNavigation: boolean = true) => {
  return (props: any) => (
    <ScreenLayout showNavigation={showNavigation}>
      <Component {...props} />
    </ScreenLayout>
  );
};

function App() {
  const isDarkMode = useColorScheme() === 'light';
  
  // Инициализация push-уведомлений перенесена в useAuth хук
  // Она будет вызываться автоматически при загрузке пользователя или после логина/регистрации
  
  return (
    <SafeAreaProvider>
      <ImagePreloader>
        <AuthWrapper>
          <NavigationContainer>
            <Stack.Navigator 
              initialRouteName="Home"
              screenOptions={{
                headerShown: false, // Скрываем стандартный заголовок
              }}
            >
              {/* Все экраны с нижней навигацией */}
              <Stack.Screen 
                name="Home" 
                component={withLayout(HomeScreen)}
                options={{
                  gestureEnabled: false, // Отключаем свайп назад
                }}
              />
              <Stack.Screen 
                name="Profile" 
                component={withLayout(ProfileScreen)}
                options={{
                  gestureEnabled: false, // Отключаем свайп назад
                }}
              />
              <Stack.Screen 
                name="History" 
                component={withLayout(HistoryScreen)}
                options={{
                  gestureEnabled: false, // Отключаем свайп назад
                }}
              />
              <Stack.Screen 
                name="Support" 
                component={withLayout(SupportScreen)}
                options={{
                  gestureEnabled: false, // Отключаем свайп назад
                }}
              />
              <Stack.Screen name="OrderStatus" component={withLayout(OrderStatusScreen)} />
              <Stack.Screen name="Bonus" component={withLayout(BonusScreen)} />
              <Stack.Screen name="Wallet" component={withLayout(WalletScreen)} />
              <Stack.Screen name="Chat" component={withLayout(ChatScreen, false)} />
              <Stack.Screen name="Address" component={withLayout(AddressScreen)} />
              <Stack.Screen name="AddOrUpdateAddress" component={withLayout(AddOrUpdateAddress)} />
              <Stack.Screen 
                name="Login" 
                component={withLayout(LoginScreen)}
                options={{
                  gestureEnabled: false, // Отключаем смахивание
                  headerLeft: () => null, // Убираем кнопку назад в заголовке
                }}
              />
              <Stack.Screen name="Register" component={withLayout(RegisterScreen)} />
              <Stack.Screen name="Otp" component={withLayout(OtpScreen)} />
              <Stack.Screen name="RegisterAccepted" component={withLayout(RegisterAcceptedScreen)} />
              <Stack.Screen name="ChangeData" component={withLayout(ChangeDataScreen)} />
              <Stack.Screen name="Tarrifs" component={withLayout(TarrifsScreen)} />
              <Stack.Screen name="FAQ" component={withLayout(FAQScreen)} />
              <Stack.Screen name="Hydration" component={withLayout(HydrationScreen)} />
              <Stack.Screen name="TakePartHydration" component={withLayout(TakePartHydrationScreen)} />
              <Stack.Screen name="TakePartInvite" component={withLayout(TakePartInviteScreen)} />
              <Stack.Screen name="StartHydration" component={withLayout(StartHydrationScreen)} />
              <Stack.Screen name="StartHydration2" component={withLayout(StartHydrationScreen2)} />
              <Stack.Screen name="AddOrder" component={withLayout(AddOrderScreen)} />
              <Stack.Screen name="Settings" component={withLayout(SettingsScreen)} />
              <Stack.Screen name="WhatIsMyBalance" component={withLayout(WhatIsMyBalanceScreen)} />
              <Stack.Screen name="HowToTopUp" component={withLayout(HowToTopUpScreen)} />
              <Stack.Screen name="DeleteAccount" component={withLayout(DeleteAccountScreen)} />
              <Stack.Screen name="ForgotPassword" component={withLayout(ForgotPasswordScreen)} />
              <Stack.Screen name="OtpForgotPassword" component={withLayout(OtpForgotPasswordScreen)} />
              <Stack.Screen name="NewPassword" component={withLayout(NewPasswordScreen)} />
            </Stack.Navigator>
          </NavigationContainer>
        </AuthWrapper>
      </ImagePreloader>
    </SafeAreaProvider>
  );
}

export default App;
