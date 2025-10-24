import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../hooks';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Navigation: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user, isAuthenticated, loadingState } = useAuth();
    
    // Получаем текущий маршрут из состояния навигации
    const currentScreen = useNavigationState(state => {
        const route = state?.routes[state.index];
        return route?.name;
    });
    
    const navigateToScreen = (screenName: keyof RootStackParamList) => {
        if (currentScreen !== screenName) {
            navigation.navigate(screenName as any);
        }
    };

    const navigationProfileOrLogin = () => {
        // Не делаем ничего пока загружаются данные
        if (loadingState === 'loading') {
            console.log('⏳ Ожидание загрузки данных пользователя...');
            return;
        }

        // После загрузки проверяем авторизацию
        if (isAuthenticated && user !== null) {
            console.log('✅ Пользователь авторизован, переход на Profile');
            navigateToScreen('Profile');
        } else {
            console.log('❌ Пользователь не авторизован, переход на Login');
            navigateToScreen('Login');
        }
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity 
                style={styles.navBlock} 
                onPress={() => navigateToScreen('Home')}
                activeOpacity={0.7}
            >
                {currentScreen === 'Home' ? (
                    <>
                        <Image source={require('../assets/homeActiveIcon.png')} style={styles.navIcon} />
                        <Text style={styles.activeText}>Главная</Text>
                    </>
                ) : (
                    <>
                        <Image source={require('../assets/homeIcon.png')} style={styles.navIcon} />
                        <Text style={styles.text}>Главная</Text>
                    </>
                )}
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={styles.navBlock} 
                onPress={() => {navigationProfileOrLogin()}}
                activeOpacity={0.7}
            >
                {currentScreen === 'Profile' || currentScreen === 'Login' || currentScreen === 'Register' ? (
                    <>
                        <Image source={require('../assets/profileActiveIcon.png')} style={styles.navIcon} />
                        <Text style={styles.activeText}>Профиль</Text>
                    </>
                ) : (
                    <>
                        <Image source={require('../assets/profileIcon.png')} style={styles.navIcon} />
                        <Text style={styles.text}>Профиль</Text>
                    </>
                )}
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={styles.navBlock} 
                onPress={() => navigateToScreen('History')}
                activeOpacity={0.7}
            >
                {currentScreen === 'History' ? (
                    <>
                        <Image source={require('../assets/historyActiveIcon.png')} style={styles.navIcon} />
                        <Text style={styles.activeText}>История</Text>
                    </>
                ) : (
                    <>
                        <Image source={require('../assets/historyIcon.png')} style={styles.navIcon} />
                        <Text style={styles.text}>История</Text>
                    </>
                )}
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={styles.navBlock} 
                onPress={() => navigateToScreen('Support')}
                activeOpacity={0.7}
            >
                {currentScreen === 'Support' ? (
                    <>
                        <Image source={require('../assets/supportActiveIcon.png')} style={styles.navIcon} />
                        <Text style={styles.activeText}>Поддержка</Text>
                    </>
                ) : (
                    <>
                        <Image source={require('../assets/supportIcon.png')} style={styles.navIcon} />
                        <Text style={styles.text}>Поддержка</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingBottom: Platform.OS === 'android' ? 15 : 30,
        backgroundColor: 'white',
    },
    navBlock: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    navIcon: {
        width: 24,
        height: 24,
    },
    activeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#EE3F58',
    },
    text: {
        fontSize: 12,
        fontWeight: '600',
        color: '#484C52',
    },
});

export default Navigation;