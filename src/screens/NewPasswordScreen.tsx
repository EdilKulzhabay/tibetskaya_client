import React, { useState, useEffect } from "react";
import { ActivityIndicator, Alert, Dimensions, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View, BackHandler, ScrollView } from "react-native";
import OutlinedFilledLabelInput from "../components/OutlinedFilledLabelInput";
import { apiService } from "../api/services";
const screenWidth = Dimensions.get('window').width

const NewPasswordScreen: React.FC<{ navigation: any, route: { params: { mail: string } } }> = ({ navigation, route }: { navigation: any, route: { params: { mail: string } } }) => {
    const mail = route?.params?.mail;
    if (!mail) {
        Alert.alert("Ошибка", "Некорректный email");
        return;
    }
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleNewPassword = async () => {
        setLoading(true);
        if (password !== confirmPassword) {
            Alert.alert("Ошибка", "Пароли не совпадают");
            setLoading(false);
            return;
        }
        const res = await apiService.updateForgottenPassword(mail, password);
        if (res.success) {
            navigation.navigate("Login");
        } else {
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
                    Установка нового пароля
                </Text>
                <Text style={styles.subtitle}>
                    Введите новый пароль
                </Text>
            </View>

            <View style={styles.contentContainer}>
                <View>
                    <OutlinedFilledLabelInput
                        label="Введите пароль" 
                        keyboardType="default" 
                        value={password} 
                        onChangeText={(text) => setPassword(text)} 
                        onRightIconPress={() => {}}
                        isPassword={true}
                        autoCapitalize="none"
                    />
                    <OutlinedFilledLabelInput
                        label="Подтвердите пароль" 
                        keyboardType="default" 
                        value={confirmPassword} 
                        onChangeText={(text) => setConfirmPassword(text)} 
                        onRightIconPress={() => {}}
                        isPassword={true}
                        autoCapitalize="none"
                    />
                </View>

                <View style={{ marginTop: 60 }}>
                    <TouchableOpacity
                        onPress={handleNewPassword}
                        style={styles.loginButton}
                    >
                        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.loginButtonText}>Сохранить пароль</Text>}
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

export default NewPasswordScreen;