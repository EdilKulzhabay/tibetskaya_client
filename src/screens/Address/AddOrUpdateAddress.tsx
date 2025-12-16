import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Back } from "../../components";
import { RootStackParamList } from "../../types/navigation";
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from "react";
import OutlinedFilledLabelInput from "../../components/OutlinedFilledLabelInput";
import MultiSelectInput from "../../components/MultiSelectInput";
import { useAuth } from "../../hooks";

type Props = NativeStackScreenProps<RootStackParamList, 'AddOrUpdateAddress'>;

const cities = [
    { label: 'Алматы', value: 'Алматы' },
    { label: 'Астана (уже скоро!)', value: 'Астана', disabled: true },
];

// Функция для генерации ObjectId в стиле MongoDB
const generateObjectId = (): string => {
    // 4 байта - временная метка (в секундах)
    const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
    
    // 5 байт - случайные данные (10 символов)
    const randomPart = Math.random().toString(16).substring(2, 12);
    
    // 3 байта - счетчик (6 символов)
    const counter = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
    
    return timestamp + randomPart + counter;
};

const AddOrUpdateAddress: React.FC<Props> = ({ navigation, route }) => {
    const { address } = route.params;
    const { user, updateUser, refreshUserData, loadingState } = useAuth()
    const [form, setForm] = useState<any>(address || null);
    const [disabled, setDisabled] = useState<boolean>(true);
    const [modalVisible, setModalVisible] = useState<boolean>(false);

    const handleChange = (key: string, value: string) => {
        setForm({ ...form, [key]: value });
    }

    const generate2GISLink = (address: string) => {
        const encodedAddress = encodeURIComponent(address);
        return `https://2gis.kz/almaty/search/${encodedAddress}`;
    };

    // Функция для добавления нового адреса
    const handleAddAddress = async () => {
        if (!user || !form) return;

        const link = generate2GISLink(form.street);
        
        try {
            const newAddress = {
                _id: generateObjectId(), // Генерируем ObjectId в стиле MongoDB
                name: form.name,
                city: form.city,
                street: form.street,
                floor: form.floor || '',
                link: link,
                apartment: form.apartment || '',
                phone: user?.phone || '',
            };

            // Добавляем новый адрес к существующему массиву
            const updatedAddresses = [...(user.addresses || []), newAddress];
            
            await updateUser('addresses', updatedAddresses);
            
            // Обновляем данные пользователя с сервера перед переходом назад
            await refreshUserData();
            
            console.log('Адрес добавлен:', newAddress);
            navigation.goBack();
        } catch (error) {
            console.error('Ошибка при добавлении адреса:', error);
        }
    };

    // Функция для обновления существующего адреса
    const handleUpdateAddress = async () => {
        if (!user || !form || !address) return;

        const link = generate2GISLink(form.street);

        const newAddress = {
            ...form,
            link: link,
            phone: user?.phone || '',
        };
        
        try {
            // Находим и обновляем существующий адрес
            const updatedAddresses = (user.addresses || []).map(addr => 
                addr._id === (address as any)._id ? { ...addr, ...newAddress } : addr
            );
            
            await updateUser('addresses', updatedAddresses);
            
            // Обновляем данные пользователя с сервера перед переходом назад
            await refreshUserData();
            
            console.log('Адрес обновлен:', newAddress);
            navigation.goBack();
        } catch (error) {
            console.error('Ошибка при обновлении адреса:', error);
        }
    };

    // Функция для удаления адреса
    const handleDeleteAddress = async () => {
        if (!user || !address) return;
        
        try {
            // Удаляем адрес из массива
            const updatedAddresses = (user.addresses || []).filter(addr => 
                addr._id !== (address as any)._id
            );
            
            await updateUser('addresses', updatedAddresses);
            
            console.log('Адрес удален:', (address as any)._id);
            setModalVisible(false);
            navigation.goBack();
        } catch (error) {
            console.error('Ошибка при удалении адреса:', error);
        }
    };

    // Общая функция для сохранения
    const handleSave = () => {
        if (address) {
            handleUpdateAddress(); // Обновляем существующий
        } else {
            handleAddAddress(); // Добавляем новый
        }
    };

    useEffect(() => {
        if (
            (!address && form?.name && form?.city && form?.street)
            || (address && (form?.name !== address?.name || form?.city !== address?.city || form?.street !== address?.street || form?.floor !== address?.floor || form?.apartment !== address?.apartment))
        ) {
            setDisabled(false);
        } else {
            setDisabled(true);
        }
    }, [form]);

    useEffect(() => {
        if (address) {
            setForm(address);
        } else {
            setForm({
                name: '',
                city: '',
                street: '',
                floor: '',
                apartment: '',
            });
        }
    }, [address]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <Back navigation={navigation} title="Добавить адрес" />
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <OutlinedFilledLabelInput
                    label="Название: (Дом, Работа, Дача)"
                    value={form?.name}
                    onChangeText={(value) => handleChange('name', value)}
                    bgWhite={true}
                />
                <MultiSelectInput
                    label="Город"
                    selectedValues={[form?.city]}
                    onChange={(values) => handleChange('city', values[0])}
                    items={cities}
                    isMulti={false}
                    bgWhite={true}
                />
                <OutlinedFilledLabelInput
                    label="Улица и дом"
                    value={form?.street}
                    onChangeText={(value) => handleChange('street', value)}
                    bgWhite={true}
                />
                <OutlinedFilledLabelInput
                    label="Этаж"
                    value={form?.floor}
                    onChangeText={(value) => handleChange('floor', value)}
                    bgWhite={true}
                />
                <OutlinedFilledLabelInput
                    label="Квартира/Офис/Кабинет"
                    value={form?.apartment}
                    onChangeText={(value) => handleChange('apartment', value)}
                    bgWhite={true}
                />

            </ScrollView>
            <View style={{paddingHorizontal: 24}}>
                {address && 
                    <TouchableOpacity 
                        style={styles.deleteButton} 
                        onPress={() => {
                            setModalVisible(true);
                        }}
                    >
                        <Text style={styles.deleteButtonText}>Удалить адрес</Text>
                    </TouchableOpacity>
                }
                <TouchableOpacity 
                    style={[styles.button, disabled ? {backgroundColor: '#F9C8C8'} : {backgroundColor: '#DC1818'}]}
                    disabled={disabled || loadingState === 'loading'}

                    onPress={handleSave}
                >
                    <Text style={styles.buttonText}>
                        {loadingState === 'loading' 
                            ? 'Сохранение...' 
                            : (address ? 'Сохранить изменения' : 'Добавить адрес')
                        }
                    </Text>
                </TouchableOpacity>
            </View>
            <Modal
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
                transparent={true}
                animationType="fade"
            >
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setModalVisible(false)}
                >
                    <TouchableOpacity 
                        style={styles.modalContainer} 
                        activeOpacity={1} 
                        onPress={(e) => e.stopPropagation()}
                    >
                        <Text style={{ fontSize: 18, marginBottom: 16, textAlign: 'center' }}>Вы уверены что хотите удалить адрес?</Text>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{flexBasis: '48%'}}>
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={[styles.deleteButtonText, {fontSize: 14}]}>Отменить</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{flexBasis: '48%'}}>
                                <TouchableOpacity
                                    style={[styles.button, {backgroundColor: '#DC1818'}]}
                                    onPress={handleDeleteAddress}
                                >
                                    <Text style={[styles.buttonText, {fontSize: 14}]}>Потвердить</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                    </TouchableOpacity>
                </TouchableOpacity>

            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'white',
        paddingBottom: 40,
        position: 'relative',
    },
    container: {
        flex: 1,
        backgroundColor: '#f6f6f6',
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    content: {
        flex: 1,
    },
    button: {
        padding: 16,
        borderRadius: 8,
        width: '100%',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 600,
        textAlign: 'center',
    },
    deleteButton: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DC1818',
        width: '100%',
        marginBottom: 16,
    },
    deleteButtonText: {
        color: '#DC1818',
        fontSize: 18,
        fontWeight: 600,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 8,
        width: '80%',
    },
});

export default AddOrUpdateAddress;