import { SafeAreaView, Text, View, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { Back } from "../../components";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks";
import { useFocusEffect } from '@react-navigation/native';

// const addresses = [];

const AddressScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user, refreshUserData, loadingState } = useAuth();
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        console.log("user = ", user);
    }, [user]);

    // Обновляем данные пользователя каждый раз когда экран становится активным
    useFocusEffect(
        useCallback(() => {
            console.log('Address screen focused - refreshing user data');
            setIsRefreshing(true);
            refreshUserData().finally(() => {
                setIsRefreshing(false);
            });
        }, [refreshUserData])
    );

    const [selectedAddress, setSelectedAddress] = useState<any>(null);

    return (
        <SafeAreaView style={styles.safeArea}>
            <Back navigation={navigation} title="Адреса" />
            
            {/* Индикатор загрузки */}
            {isRefreshing && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#DC1818" />
                    <Text style={styles.loadingText}>Обновление данных...</Text>
                </View>
            )}
            
            {user?.addresses && user?.addresses?.length > 0 && (
                <View style={styles.container}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {user?.addresses.map((address) => (
                            <TouchableOpacity 
                                style={[styles.addressContainer, selectedAddress?._id === address._id && {borderWidth: 1, borderColor: '#DC1818'}]} 
                                key={address._id}
                                onPress={() => {
                                    console.log("address = ", address);
                                    console.log("selectedAddress = ", selectedAddress);
                                    if (selectedAddress?._id === address._id) {
                                        setSelectedAddress(null);
                                    } else {
                                        setSelectedAddress(address);
                                    }
                                }}    
                            >
                                <Text style={styles.addressName}>{address.name}</Text>
                                <View style={{ width: '100%', height: 1, backgroundColor: '#E5E5E5', marginTop: 10, marginBottom: 14}}/>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#545454'}}>адрес:</Text>
                                <Text style={styles.addressText}>{address.street}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={emptyStyles.button} onPress={() => navigation.navigate('AddOrUpdateAddress', { address: selectedAddress })}>
                        <Text style={emptyStyles.buttonText}>{selectedAddress ? 'Изменить адрес' : 'Добавить адрес'}</Text>
                    </TouchableOpacity>
                </View>
            )}
            {user?.addresses && user?.addresses?.length === 0 && (
                <View style={emptyStyles.container}>
                    <View/>
                    <View style={emptyStyles.content}>
                        <Image source={require('../../assets/greenLocation.png')} style={emptyStyles.image} />
                        <Text style={emptyStyles.title}>Адресов пока нет</Text>
                        <Text style={emptyStyles.subtitle}>Добавьте адрес чтобы начать заказывать</Text>
                    </View>
                    <TouchableOpacity style={emptyStyles.button} onPress={() => navigation.navigate('AddOrUpdateAddress', { address: null })}>
                        <Text style={emptyStyles.buttonText}>Добавить адрес</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const emptyStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f6f6f6',
        paddingTop: 16,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    content: {
        alignItems: 'center',
    },
    image: {
        width: 50,
        height: 50,
    },
    title: {
        fontSize: 24,
        fontWeight: 700,
        color: '#545454',
        marginTop: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        fontWeight: 500,
        color: '#545454',
        marginTop: 12,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#DC1818',
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
});

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'white',
    },
    container: {
        flex: 1,
        backgroundColor: '#f6f6f6',
        paddingTop: 16,
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    addressContainer: {
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 2,
        elevation: 5,
    },
    addressName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#0C341F',
    },
    addressText: {
        fontSize: 18,
        fontWeight: 600,
        color: "#0C341F"
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    loadingText: {
        fontSize: 16,
        fontWeight: 500,
        color: '#DC1818',
        marginTop: 12,
    },
});

export default AddressScreen;