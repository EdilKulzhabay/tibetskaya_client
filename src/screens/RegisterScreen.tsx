import { ActivityIndicator, Alert, Dimensions, Image, Linking, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import OutlinedFilledLabelInput from "../components/OutlinedFilledLabelInput";
import { useState } from "react";
import { MySwitchToggle } from "../components";
import { apiService } from "../api/services";
const screenWidth = Dimensions.get('window').width

const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [form, setForm] = useState({
        fullName: "edil",
        mail: "edil.kulzhabay01@gmail.com",
        phone: "+77777777777",
        password: "123456",
        confirmPassword: "123456",
        termsAccepted: true,
        privacyAccepted: true,
    });
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!form.mail || !form.fullName || !form.phone || !form.password || !form.confirmPassword) {
            Alert.alert("Ошибка", "Пожалуйста, заполните все поля");
            return;
        }
        if (form.password !== form.confirmPassword) {
            Alert.alert("Ошибка", "Пароли не совпадают");
            return;
        }
        if (!form.termsAccepted || !form.privacyAccepted) {
            Alert.alert("Ошибка", "Пожалуйста, примите условия обслуживания и политику конфиденциальности");
            return;
        }
        setLoading(true);
        const res = await apiService.sendCode(form.mail);
        if (res.success) {
            navigation.navigate("Otp", {data: form});
        } else {
            Alert.alert("Ошибка", res.message);
        }
        setLoading(false);
    }

    return (
        <ScrollView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#DC1818" />
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
                <OutlinedFilledLabelInput
                    label="Имя и фамилия"
                    value={form.fullName}
                    onChangeText={(text) => setForm({...form, fullName: text})}
                    bgWhite={true}
                />
                
                <OutlinedFilledLabelInput
                    label="Почта"
                    value={form.mail}
                    onChangeText={(text) => setForm({...form, mail: text})}
                    bgWhite={true}
                />
                
                <OutlinedFilledLabelInput 
                    label="Номер телефона" 
                    keyboardType="phone-pad" 
                    value={form.phone} 
                    onChangeText={(text) => setForm({ ...form, phone: text })} 
                    mask="phone"
                    onRightIconPress={() => {}}
                    bgWhite={true}
                />
                
                <OutlinedFilledLabelInput
                    label="Пароль"
                    value={form.password}
                    onChangeText={(text) => setForm({...form, password: text})}
                    bgWhite={true}
                    onRightIconPress={() => {}}
                    isPassword={true}
                    autoCapitalize="none"
                />
                
                <OutlinedFilledLabelInput
                    label="Подтвердите пароль"
                    value={form.confirmPassword}
                    onChangeText={(text) => setForm({...form, confirmPassword: text})}
                    bgWhite={true}
                    onRightIconPress={() => {}}
                    isPassword={true}
                    autoCapitalize="none"
                />

                <View style={styles.agreementRow}>
                    <View>
                        <Text style={styles.agreementText}>
                            Я согласен с{' '}
                        </Text>
                        <TouchableOpacity onPress={() => Linking.openURL('https://tibetskaya.kz/agreement')}>
                            <Text style={styles.agreementLink}>Условиями обслуживания</Text>
                        </TouchableOpacity>
                    </View>
                    <MySwitchToggle
                        value={form.termsAccepted}
                        onPress={() => setForm({ ...form, termsAccepted: !form.termsAccepted })}
                    />
                </View>

                <View style={styles.agreementRow}>
                    <View>
                        <Text style={styles.agreementText}>
                            Я согласен с{' '}
                        </Text>
                        <TouchableOpacity onPress={() => Linking.openURL('https://tibetskaya.kz/privacyPolicy')}>
                            <Text style={styles.agreementLink}>Политикой конфиденциальности</Text>
                        </TouchableOpacity>
                    </View>
                    <MySwitchToggle
                        value={form.privacyAccepted}
                        onPress={() => setForm({ ...form, privacyAccepted: !form.privacyAccepted })}
                    />
                </View>
                
                <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
                    {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.registerButtonText}>Зарегистрироваться</Text>}
                </TouchableOpacity>
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
        paddingHorizontal: 24,
        marginTop: 20,
        paddingBottom: 40,
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
        textAlign: 'center'
    },
    agreementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20
    },
    agreementText: {
        width: '60%'
    },
    agreementLink: {
        color: 'blue'
    }
});

export default RegisterScreen;