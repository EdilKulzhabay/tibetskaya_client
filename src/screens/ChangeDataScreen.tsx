import { SafeAreaView, Text, View, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Back } from "../components";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks";
import OutlinedFilledLabelInput from "../components/OutlinedFilledLabelInput";
import { apiService } from "../api/services";

const ChangeDataScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const [form, setForm] = useState({
        userName: user?.userName || "",
        mail: user?.mail || "",
        phone: user?.phone || "",
        password: "",
        confirmPassword: "",
    });

    useEffect(() => {
        setForm({
            userName: user?.userName || "",
            mail: user?.mail || "",
            phone: user?.phone || "",
            password: "",
            confirmPassword: "",
        });
    }, [user]);

    const handleChange = (field: string, value: string) => {
        setForm({ ...form, [field]: value });
    };

    const handleChangeData = async () => {
        try {
            if (form.userName != user?.userName) {
                await apiService.updateData(user?.mail || '', 'userName', form.userName);
            }
            if (form.mail != user?.mail) {
                await apiService.updateData(user?.mail || '', 'mail', form.mail);
            }
            if (form.phone != user?.phone) {
                await apiService.updateData(user?.mail || '', 'phone', form.phone);
            }
            if (form.password != '' && form.password === form.confirmPassword) {
                await apiService.updateData(user?.mail || '', 'password', form.password);
            }
            Alert.alert('Данные успешно изменены');
            navigation.goBack();
        } catch (error) {
            console.log('error', error);
            Alert.alert('Ошибка при изменении данных');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Back navigation={navigation} title="Изменить данные" />
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                    <OutlinedFilledLabelInput
                        label="Имя"
                        value={form.userName}
                        onChangeText={(value) => handleChange('userName', value)}
                        bgWhite={true}
                    />
                    <OutlinedFilledLabelInput
                        label="Почта"
                        value={form.mail}
                        onChangeText={(value) => handleChange('mail', value)}
                        bgWhite={true}
                    />
                    <OutlinedFilledLabelInput
                        label="Номер телефона"
                        value={form.phone}
                        onChangeText={(value) => handleChange('phone', value)}
                        bgWhite={true}
                    />
                    <OutlinedFilledLabelInput
                        label="Пароль"
                        value={form.password}
                        onChangeText={(value) => handleChange('password', value)}
                        bgWhite={true}
                    />
                    <OutlinedFilledLabelInput
                        label="Подтвердите пароль"
                        value={form.confirmPassword}
                        onChangeText={(value) => handleChange('confirmPassword', value)}
                        bgWhite={true}
                    />
                <TouchableOpacity style={styles.button} onPress={handleChangeData}>
                    <Text style={styles.buttonText}>Изменить данные</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'white',
    },
    container: {
        flex: 1,
        backgroundColor: '#f6f6f6',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 40,
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: '#DC1818',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 600,
    },
});

export default ChangeDataScreen;