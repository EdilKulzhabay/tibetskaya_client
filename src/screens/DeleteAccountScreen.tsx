import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { Back } from '../components';
import { clearAllData } from '../utils/storage';
import { apiService } from '../api/services';
import { useAuth } from '../hooks/useAuth';

const DeleteAccountScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);

    const deleteAccount = async () => {
        if (!user?.mail) {
            Alert.alert('Ошибка', 'Не удалось получить данные пользователя.');
            return;
        }

        Alert.alert(
            'Подтверждение удаления',
            'Вы уверены, что хотите удалить аккаунт? Это действие необратимо.',
            [
                {
                    text: 'Отмена',
                    style: 'cancel',
                },
                {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsDeleting(true);
                            
                            // Отправляем запрос на удаление аккаунта на сервер
                            const response = await apiService.deleteAccount(user.mail);
                            
                            if (response.success) {
                                // Удаляем все данные из AsyncStorage
                                await clearAllData();
                                
                                // Переходим на главную страницу
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'Home' }],
                                });
                            } else {
                                throw new Error(response.message || 'Не удалось удалить аккаунт');
                            }
                        } catch (error) {
                            console.error('Ошибка при удалении аккаунта:', error);
                            Alert.alert('Ошибка', 'Не удалось удалить аккаунт. Попробуйте снова.');
                        } finally {
                            setIsDeleting(false);
                        }
                    },
                },
            ]
        );
    }
    return (
        <SafeAreaView style={styles.safeArea}>
            <Back navigation={navigation} title="Удалить аккаунт" />
            <View style={styles.container}>
                <Text style={styles.title}>Внимание!</Text>
                <Text style={styles.subtitle}>После удаления аккаунта его{'\n'}восстановление будет невозможно</Text>
                <TouchableOpacity
                    onPress={() => deleteAccount()}
                    style={[styles.button, isDeleting && styles.buttonDisabled]}
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <ActivityIndicator color="#DC1818" />
                    ) : (
                        <Text style={styles.buttonText}>Удалить аккаунт</Text>
                    )}
                </TouchableOpacity>
            </View>
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
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        backgroundColor: '#f6f6f6',
    },
    title: {
        fontSize: 24,
        fontWeight: 600,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#4D4353',
        textAlign: 'center',
        marginTop: 8,
    },
    button: {
        backgroundColor: 'white',
        width: '100%',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DC1818',
        marginTop: 40,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#DC1818',
        fontSize: 16,
        fontWeight: 600,
        textAlign: 'center',
    },
});

export default DeleteAccountScreen;