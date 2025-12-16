import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, Keyboard } from 'react-native';
import { apiService } from '../api/services';
// import { registerForPushNotificationsAsync } from '../utils/registerForPushNotificationsAsync';
// import { saveCourierData, saveTokenData } from '../utils/storage';
import { RootStackParamList } from '../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../hooks';

type OtpScreenProps = NativeStackScreenProps<RootStackParamList, 'Otp'>;
const OTP_LENGTH = 6;
const screenWidth = Dimensions.get('window').width

const OtpScreen: React.FC<OtpScreenProps> = ({ navigation, route }) => {
    const form = route.params.data;
    const { saveUserData } = useAuth();

    const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [timer, setTimer] = useState(59);
    const inputs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {
        console.log("form in otp = ", form);
    }, []);

    const handleChange = async (text: string, index: number) => {
        const newCode = [...code];
        
        // Если текст пустой (удаление), очищаем текущий инпут и переходим к предыдущему
        if (text === '') {
            newCode[index] = '';
            setCode(newCode);
            if (index > 0) {
                inputs.current[index - 1]?.focus();
            }
            return;
        }
        
        // Если введен символ, сохраняем его
        newCode[index] = text;
        setCode(newCode);

        // Переходим к следующему инпуту
        if (text && index < OTP_LENGTH - 1) {
            inputs.current[index + 1]?.focus();
        }
        
        // Если код полностью введен, проверяем его
        if (index === OTP_LENGTH - 1 && text) {
            const fullCode = newCode.join('');
            if (fullCode.length === OTP_LENGTH) {
                Keyboard.dismiss(); // Скрываем клавиатуру
                
                const res = await apiService.codeConfirm(form.mail, fullCode);
                console.log("res in otp = ", res);
                if (res.success) {
                    const registerRes = await apiService.clientRegister(form);
                    console.log("registerRes in otp = ", registerRes);
                    // Сохраняем данные пользователя и токены если они есть в ответе
                    if (registerRes.clientData && registerRes.accessToken) {
                        await saveUserData(registerRes);
                    }
                    if (registerRes.success) {
                        navigation.navigate("RegisterAccepted");
                    } else {
                        Alert.alert("Ошибка", registerRes.message);
                    }
                } else {
                    Alert.alert("Ошибка", res.message);
                }
            }
        }

        // // Если код полностью введен
        // if (index === OTP_LENGTH - 1) {
        //     const fullCode = newCode.join('');
        //     try {
        //         const res = await apiService.codeConfirm({mail: form.mail, code: fullCode});
        //         if (res.success) {
        //             const response = await apiService.registerCourier(form); // обработать fullCode
        //             if (response.success) {
        //                 console.log("response in otp = ", response);
                    
        //                 // const token = await registerForPushNotificationsAsync();
        //                 // if (token && response.userData && response.userData.notificationPushToken !== token) {
        //                 //     await apiService.updateData(response.userData._id, "notificationPushToken", token);
        //                 //     await saveCourierData({ ...response.userData, notificationPushToken: token });
        //                 // } else {
        //                 //     await saveCourierData({ ...response.userData });
        //                 // }

        //                 // await saveTokenData({
        //                 //     token: response.token,
        //                 // });
        //             } else {
        //             // Обработка ошибки
        //                 console.error('Ошибка при регистрации:', response.error);
        //             }
        //         } else {
        //             console.error('Ошибка при подтверждении кода:', res.message);
        //             Alert.alert("Ошибка", "Ошибка при подтверждении кода:");
        //         }
        //     } catch (error) {
        //         console.error('Ошибка при отправке данных:', error);
        //     }
        // }
    };
    
    const handleResendCode = async () => {
        const response = await apiService.sendCode(form.mail);
        if (response.success) {
            console.log("response in otp = ", response);
            setTimer(59);
            // Очищаем все поля при повторной отправке кода
            setCode(Array(OTP_LENGTH).fill(''));
            inputs.current[0]?.focus();
        }
    }

    const clearAllFields = () => {
        setCode(Array(OTP_LENGTH).fill(''));
        inputs.current[0]?.focus();
    }

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer(timer - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    useEffect(() => {
        handleResendCode();
    }, []);


    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <View style={styles.imageContainer}>
                <Image
                source={require('../assets/loginBanner.png')} 
                style={{height: screenWidth / 1.76}}
                resizeMode="contain"
                />
            </View>
            <View style={styles.content}>
                <Text style={styles.title}>Дождитесь кода из сообщения</Text>
                <Text style={styles.subtitle}>Код отправлен на почту {form.mail}</Text>

                <View style={styles.codeContainer}>
                {code.map((digit, index) => (
                    <TextInput
                        key={index}
                        style={styles.inputBox}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={digit}
                        onChangeText={(text) => handleChange(text, index)}
                        onKeyPress={({ nativeEvent }) => {
                            // Обработка нажатия клавиши "Назад"
                            if (nativeEvent.key === 'Backspace' && !digit && index > 0) {
                                inputs.current[index - 1]?.focus();
                            }
                        }}
                        ref={(ref) => {
                            if (ref) {
                                inputs.current[index] = ref;
                            }
                        }}
                    />
                ))}
                </View>

                <Text style={styles.timerText}>
                    Получить новый код можно через{' '}
                    <Text style={styles.timerHighlight}>{timer} сек</Text>
                </Text>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        disabled={timer > 0}
                        onPress={handleResendCode}
                    >
                        {timer === 0 && (
                            <Text style={styles.resendText}>
                            Отправить код повторно
                            </Text>
                        )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        onPress={clearAllFields}
                        style={styles.clearButton}
                    >
                        <Text style={styles.clearButtonText}>
                            Очистить
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    imageContainer: {
        width: '100%',
        alignItems: 'center'
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 24,
        marginTop: 32
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8
    },
    subtitle: {
        color: 'gray',
        marginBottom: 24
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 320,
        marginBottom: 24
    },
    inputBox: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        width: 48,
        height: 56,
        textAlign: 'center',
        fontSize: 20,
        borderRadius: 8
    },
    timerText: {
        color: '#666'
    },
    timerHighlight: {
        color: '#DC1818'
    },
    resendText: {
        color: '#0066cc',
        marginTop: 12,
        fontWeight: '500'
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 20
    },
    clearButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 6
    },
    clearButtonText: {
        color: '#666',
        fontWeight: '500'
    }
});

export default OtpScreen;