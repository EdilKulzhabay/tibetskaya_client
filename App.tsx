/**
 * Главный компонент приложения
 * @format
 */

import React from 'react';
import {StatusBar, StyleSheet, useColorScheme, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';

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
  AddOrderScreen
} from './src/screens';
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  const isDarkMode = useColorScheme() === 'light';
  
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{
            headerShown: false, // Скрываем стандартный заголовок
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="Support" component={SupportScreen} />
          <Stack.Screen name="OrderStatus" component={OrderStatusScreen} />
          <Stack.Screen name="Bonus" component={BonusScreen} />
          <Stack.Screen name="Wallet" component={WalletScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Address" component={AddressScreen} />
          <Stack.Screen name="AddOrUpdateAddress" component={AddOrUpdateAddress} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Otp" component={OtpScreen} />
          <Stack.Screen name="RegisterAccepted" component={RegisterAcceptedScreen} />
          <Stack.Screen name="ChangeData" component={ChangeDataScreen} />
          <Stack.Screen name="Tarrifs" component={TarrifsScreen} />
          <Stack.Screen name="FAQ" component={FAQScreen} />
          <Stack.Screen name="Hydration" component={HydrationScreen} />
          <Stack.Screen name="TakePartHydration" component={TakePartHydrationScreen} />
          <Stack.Screen name="TakePartInvite" component={TakePartInviteScreen} />
          <Stack.Screen name="StartHydration" component={StartHydrationScreen} />
          <Stack.Screen name="StartHydration2" component={StartHydrationScreen2} />
          <Stack.Screen name="AddOrder" component={AddOrderScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default App;
