import React, { useState, useEffect } from "react";
import { ActivityIndicator, Alert, Dimensions, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View, BackHandler, ScrollView } from "react-native";
import OutlinedFilledLabelInput from "../components/OutlinedFilledLabelInput";
import { apiService } from "../api/services";
import { useAuth } from "../hooks/useAuth";
import { useFocusEffect } from '@react-navigation/native';
const screenWidth = Dimensions.get('window').width

const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { saveUserData } = useAuth();
    const [mail, setMail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false);

    // Обработка кнопки "Назад" на Android
    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                navigation.navigate('Home');
                return true; // Предотвращаем стандартное поведение
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => subscription.remove();
        }, [navigation])
    );


    const handleLogin = async () => {
        setLoading(true);
        const res = await apiService.clientLogin({mail, password});
        if (res.success) {
            // Передаем весь ответ сервера (включая токены)
            setLoading(false);
            await saveUserData(res);
            Alert.alert("Успешно", `Добро пожаловать, ${res.clientData.userName}!`);
            navigation.navigate("Home");
        } else {
            setLoading(false);
            Alert.alert("Ошибка", res.message);
        }
    }
    return (
        <ScrollView style={styles.container}>
            <View style={styles.bannerContainer}>
                <Image
                    source={require('../assets/loginBanner.png')} 
                    style={{height: screenWidth / 1.76}}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.headerContainer}>
                <Text style={styles.title}>
                    Добро пожаловать!
                </Text>
                <Text style={styles.subtitle}>
                    Введите данные, чтобы продолжить
                </Text>
            </View>

            <View style={styles.contentContainer}>
                <View>
                    <OutlinedFilledLabelInput
                        label="Введите почту" 
                        keyboardType="email-address" 
                        value={mail} 
                        onChangeText={(text) => setMail(text)} 
                        onRightIconPress={() => {}}
                        autoCapitalize="none"
                    />

                    <OutlinedFilledLabelInput
                        label="Введите пароль" 
                        keyboardType="default" 
                        value={password} 
                        onChangeText={(text) => setPassword(text)} 
                        onRightIconPress={() => {}}
                        isPassword={true}
                        autoCapitalize="none"
                    />

                    <TouchableOpacity onPress={() => {}} style={styles.forgotPassword}>
                        <Text style={styles.forgotPasswordText}>Забыли пароль?</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ marginTop: 60 }}>
                    <TouchableOpacity
                        onPress={handleLogin}
                        style={styles.loginButton}
                    >
                        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.loginButtonText}>Войти</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {navigation.navigate("Register")}} 
                        style={styles.registerContainer}>
                        <Text style={styles.registerText}>
                            Еще нет аккаунта? <Text style={styles.registerLink}>Зарегистрироваться</Text>
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
    },
    bannerContainer: {
        width: '100%',
        alignItems: 'center'
    },
    headerContainer: {
        marginTop: 38,
        paddingHorizontal: 24
    },
    title: {
        fontSize: 24,
        fontWeight: '600'
    },
    subtitle: {
        marginTop: 12,
        fontSize: 14,
        opacity: 0.4
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
        alignItems: 'flex-end'
    },
    forgotPasswordText: {
        color: '#DC1818',
        fontWeight: '500',
        fontSize: 14
    },
    registerContainer: {
        marginTop: 20
    },
    registerText: {
        color: 'black',
        textAlign: 'center',
        fontSize: 16,
    },
    registerLink: {
        color: '#DC1818',
        fontWeight: '500'
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
        textAlign: 'center'
    }
});

export default LoginScreen;