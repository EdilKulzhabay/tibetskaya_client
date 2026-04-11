import { ActivityIndicator, Alert, Dimensions, Image, Keyboard, Linking, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import OutlinedFilledLabelInput from "../components/OutlinedFilledLabelInput";
import { useEffect, useRef, useState } from "react";
import { MySwitchToggle } from "../components";
import { apiService } from "../api/services";
const screenWidth = Dimensions.get('window').width

const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [form, setForm] = useState({
        userName: "",
        mail: "",
        phone: "",
        password: "",
        confirmPassword: "",
        referralCode: "",
        termsAccepted: false,
        privacyAccepted: false,
    });
    const [loading, setLoading] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    
    // Refs для навигации между полями
    const nameRef = useRef<TextInput>(null);
    const mailRef = useRef<TextInput>(null);
    const phoneRef = useRef<TextInput>(null);
    const passRef = useRef<TextInput>(null);
    const confirmRef = useRef<TextInput>(null);
    const referralRef = useRef<TextInput>(null);

    // Отслеживание состояния клавиатуры
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
            setIsKeyboardVisible(true);
        });
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setIsKeyboardVisible(false);
        });

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const handleRegister = async () => {
        if (!form.mail || !form.userName || !form.phone || !form.password || !form.confirmPassword) {
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
        const nextForm = {
            ...form,
            mail: form.mail.trim(),
            userName: form.userName.trim(),
            phone: form.phone.trim(),
            password: form.password.trim(),
            confirmPassword: form.confirmPassword.trim(),
            referralCode: form.referralCode.trim().toUpperCase(),
        };
        setForm(nextForm);
        try {
            const res = await apiService.sendCode(nextForm.mail, nextForm.phone);
            if (res.success) {
                navigation.navigate("Otp", { data: nextForm });
            } else {
                Alert.alert("Ошибка", (res as { message?: string }).message || "Не удалось отправить код");
            }
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                "Не удалось отправить код";
            Alert.alert("Ошибка", msg);
        }
        setLoading(false);
    }

    return (
        <ScrollView 
            style={styles.container}
            contentContainerStyle={{ paddingBottom: isKeyboardVisible ? 80 : 40 }}
        >
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
                    value={form.userName}
                    onChangeText={(text) => setForm({...form, userName: text})}
                    bgWhite={true}
                    inputRef={nameRef}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => mailRef.current?.focus()}
                />
                
                <OutlinedFilledLabelInput
                    label="Почта"
                    value={form.mail}
                    onChangeText={(text) => setForm({...form, mail: text})}
                    bgWhite={true}
                    inputRef={mailRef}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onSubmitEditing={() => phoneRef.current?.focus()}
                />
                
                <OutlinedFilledLabelInput 
                    label="Номер телефона" 
                    keyboardType="name-phone-pad"
                    value={form.phone} 
                    onChangeText={(text) => setForm({ ...form, phone: text })} 
                    mask="phone"
                    onRightIconPress={() => {}}
                    bgWhite={true}
                    inputRef={phoneRef}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => passRef.current?.focus()}
                />
                
                <OutlinedFilledLabelInput
                    label="Пароль"
                    value={form.password}
                    onChangeText={(text) => setForm({...form, password: text})}
                    bgWhite={true}
                    onRightIconPress={() => {}}
                    isPassword={true}
                    autoCapitalize="none"
                    inputRef={passRef}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => confirmRef.current?.focus()}
                />
                
                <OutlinedFilledLabelInput
                    label="Подтвердите пароль"
                    value={form.confirmPassword}
                    onChangeText={(text) => setForm({...form, confirmPassword: text})}
                    bgWhite={true}
                    onRightIconPress={() => {}}
                    isPassword={true}
                    autoCapitalize="none"
                    inputRef={confirmRef}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => referralRef.current?.focus()}
                />

                <OutlinedFilledLabelInput
                    label="Реферальный код (необязательно)"
                    value={form.referralCode}
                    onChangeText={(text) => setForm({ ...form, referralCode: text.toUpperCase() })}
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
                        <Text style={styles.agreementText}>
                            Я согласен с{' '}
                        </Text>
                        <TouchableOpacity onPress={() => Linking.openURL('https://tibetskaya.kz/publicOffer')}>
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