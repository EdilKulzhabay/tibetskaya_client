import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Navigation: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute();
    
    const currentScreen = route.name;
    
    const navigateToScreen = (screenName: keyof RootStackParamList) => {
        if (currentScreen !== screenName) {
            navigation.navigate(screenName as any);
        }
    };

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
                onPress={() => navigateToScreen('Profile')}
                activeOpacity={0.7}
            >
                {currentScreen === 'Profile' ? (
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
        padding: 12,
        paddingBottom: 10,
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