import React, { useState, useEffect } from "react";
import { ActivityIndicator, Alert, Dimensions, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View, BackHandler, ScrollView } from "react-native";
import OutlinedFilledLabelInput from "../components/OutlinedFilledLabelInput";
import { apiService } from "../api/services";
const screenWidth = Dimensions.get('window').width

const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [recoveryMethod, setRecoveryMethod] = useState<'phone' | 'mail'>('phone');
    const [mail, setMail] = useState("")
    const [phone, setPhone] = useState("")
    const [loading, setLoading] = useState(false);

    const handleForgotPassword = async () => {
        setLoading(true);
        const identifier = recoveryMethod === 'phone' ? { phone } : { mail };
        const res = await apiService.sendMailForgotPassword(identifier);
        if (res.success) {
            navigation.navigate("OtpForgotPassword", identifier);
        } else {
            Alert.alert("Ошибка", res.message);
        }
        setLoading(false);
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
                    Восстановление пароля
                </Text>
                <Text style={styles.subtitle}>
                    {recoveryMethod === 'phone'
                        ? 'Введите номер телефона, чтобы восстановить пароль'
                        : 'Введите почту, чтобы восстановить пароль'}
                </Text>
            </View>

            <View style={styles.contentContainer}>
                <View>
                    {recoveryMethod === 'phone' ? (
                        <OutlinedFilledLabelInput
                            label="Номер телефона"
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={(text) => setPhone(text)}
                            mask="phone"
                            onRightIconPress={() => {}}
                        />
                    ) : (
                        <OutlinedFilledLabelInput
                            label="Введите почту"
                            keyboardType="email-address"
                            value={mail}
                            onChangeText={(text) => setMail(text)}
                            onRightIconPress={() => {}}
                            autoCapitalize="none"
                        />
                    )}

                    <TouchableOpacity
                        onPress={() => setRecoveryMethod(recoveryMethod === 'phone' ? 'mail' : 'phone')}
                        style={styles.forgotPassword}
                    >
                        <Text style={styles.forgotPasswordText}>
                            {recoveryMethod === 'phone' ? 'Восстановить через почту' : 'Восстановить через телефон'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={{ marginTop: 60 }}>
                    <TouchableOpacity
                        onPress={handleForgotPassword}
                        style={styles.loginButton}
                    >
                        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.loginButtonText}>Восстановить пароль</Text>}
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

export default ForgotPasswordScreen;