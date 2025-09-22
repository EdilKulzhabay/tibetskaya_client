import { SafeAreaView, Text, View, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { Back } from "../components";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks";
import OutlinedFilledLabelInput from "../components/OutlinedFilledLabelInput";



const ChangeDataScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const [form, setForm] = useState({
        fullName: user?.fullName || "",
        mail: user?.mail || "",
        phone: user?.phone || "",
        password: user?.password || "",
        confirmPassword: user?.password || "",
    });

    useEffect(() => {
        setForm({
            fullName: user?.fullName || "",
            mail: user?.mail || "",
            phone: user?.phone || "",
            password: user?.password || "",
            confirmPassword: user?.password || "",
        });
    }, [user]);

    const handleChange = (field: string, value: string) => {
        setForm({ ...form, [field]: value });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Back navigation={navigation} title="Изменить данные" />
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                    <OutlinedFilledLabelInput
                        label="Имя"
                        value={form.fullName}
                        onChangeText={(value) => handleChange('fullName', value)}
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
                <TouchableOpacity style={styles.button}>
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