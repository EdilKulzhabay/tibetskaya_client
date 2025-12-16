import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, Image, Modal, ActivityIndicator, Alert, ScrollView, TextInput } from "react-native";
import Back from "../components/Back";
import { useAuth } from "../hooks";
import { useState, useCallback, useEffect, useRef } from "react";
import { apiService } from "../api/services";
import { useFocusEffect } from "@react-navigation/native";

const payments = [
    { label: 'Наличными', value: 'fakt' },
    { label: 'Картой', value: 'card' },
];

const calls = [
    { label: 'Позвонить заранее', value: true },
    { label: 'Не звонить', value: false },
];

const AddOrderScreen: React.FC<{ navigation: any, route: any }> = ({ navigation, route }) => {
    const { products } = route.params;
    const { user, refreshUserData } = useAuth();

    const [price12, setPrice12] = useState(user?.price12 || 900);
    const [price19, setPrice19] = useState(user?.price19 || 1300);
    const [count12, setCount12] = useState(products.b12 || 0);
    const [count19, setCount19] = useState(products.b19 || 0);

    const [addressModalVisible, setAddressModalVisible] = useState(false);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [callModalVisible, setCallModalVisible] = useState(false);
    const [dateModalVisible, setDateModalVisible] = useState(false);

    const [selectedAddress, setSelectedAddress] = useState<any>(null);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [selectedCall, setSelectedCall] = useState<any>(calls[0]);
    const [selectedDate, setSelectedDate] = useState<any>(null);
    const [availableDates, setAvailableDates] = useState<any[]>([]);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [scrollPaddingBottom, setScrollPaddingBottom] = useState(0);
    const [commentInputY, setCommentInputY] = useState(0);
    
    const scrollViewRef = useRef<ScrollView>(null);
    const commentInputRef = useRef<TextInput>(null);

    useEffect(() => {
        console.log('🔄 AddOrderScreen: selectedDate', selectedDate);
    }, [selectedDate]);

    // Функция для генерации доступных дат (исключая воскресенья)
    const generateAvailableDates = useCallback(() => {
        const dates = [];
        const now = new Date();
        const currentHour = now.getHours();
        
        // Определяем, можно ли выбрать "Сегодня"
        const canSelectToday = currentHour < 19;
        
        // Начинаем с сегодня или с завтра
        let startDate = new Date();
        if (!canSelectToday) {
            startDate.setDate(startDate.getDate() + 1);
        }
        
        // Генерируем даты на следующие 14 дней, исключая воскресенья
        for (let i = 0; i < 30; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            // Пропускаем воскресенье (0)
            if (date.getDay() !== 0) {
                const dateStr = date.toISOString().split('T')[0];
                const isToday = date.toDateString() === new Date().toDateString();
                const dayName = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][date.getDay()];
                
                dates.push({
                    value: dateStr,
                    label: isToday ? 'Сегодня' : `${dayName}, ${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`,
                    date: date
                });
            }
        }
        console.log('🔄 AddOrderScreen: dates', dates);
        return dates;
    }, []);

    // Инициализация доступных дат и начального значения
    useEffect(() => {
        const dates = generateAvailableDates();
        setAvailableDates(dates);
        
        // Устанавливаем первую доступную дату по умолчанию
        if (dates.length > 0 && !selectedDate) {
            setSelectedDate(dates[0]);
        }
    }, [generateAvailableDates]);

    // Обновляем данные пользователя при загрузке страницы
    useFocusEffect(
        useCallback(() => {
            console.log('🔄 AddOrderScreen: обновляем данные пользователя');
            refreshUserData();
        }, [refreshUserData])
    );

    // Обновляем цены когда изменяются данные пользователя
    useEffect(() => {
        if (user) {
            console.log('💰 Обновляем цены:', user.price12, user.price19);
            setPrice12(user.price12 || 900);
            setPrice19(user.price19 || 1300);
        }
    }, [user, user?.price12, user?.price19]);

    const handleOrder = async () => {
        setLoading(true);
        if (!selectedAddress) {
            Alert.alert('Ошибка', 'Пожалуйста, выберите адрес доставки');
            setLoading(false);
            return;
        }
        if (!selectedPayment) {
            Alert.alert('Ошибка', 'Пожалуйста, выберите способ оплаты');
            setLoading(false);
            return;
        }

        if (count12 + count19 < 2) {
            Alert.alert('Ошибка', 'Пожалуйста, выберите хотя бы 2 бутыля воды');
            setLoading(false);
            return;
        }

        if (!selectedCall) {
            Alert.alert('Ошибка', 'Пожалуйста, выберите нужен ли звонок от курьера');
            setLoading(false);
            return;
        }

        if (!selectedDate) {
            Alert.alert('Ошибка', 'Пожалуйста, выберите дату доставки');
            setLoading(false);
            return;
        }

        let actualAddress = selectedAddress.street;
        if (selectedAddress.floor) {
            actualAddress += `, этаж ${selectedAddress.floor}`;
        }
        if (selectedAddress.apartment) {
            actualAddress += `, квартира ${selectedAddress.apartment}`;
        }

        const orderAddress = {
            actual: actualAddress,
            name: selectedAddress.name,
            phone: user?.phone,
            point: {
                lat: selectedAddress?.point?.lat || "",
                lon: selectedAddress?.point?.lon || "",
            },
            link: selectedAddress?.link || "",
        }

        try {
            const res = await apiService.addOrder(
                user?.mail || "", 
                orderAddress, 
                { b12: count12, b19: count19 }, 
                [], 
                {d: selectedDate?.value, time: ""}, 
                selectedPayment?.value,
                selectedCall?.value,
                comment,
            );


            if (res.success) {
                Alert.alert('Успешно', 'Заказ оформлен');
                setLoading(false);
                navigation.navigate('Home');
            } else {
                Alert.alert('Ошибка', res.message);
            }
        } catch (error) {
            console.error('Ошибка при оформлении заказа:', error);
        }
        setLoading(false);
    }

    useEffect(() => {
        if (selectedPayment && selectedPayment.value === 'card') {
            const totalAmount = count12 * price12 + count19 * price19;
            if (user && user.balance !== undefined && user.balance !== null && user.balance < totalAmount) {
                setSelectedPayment(null);
                Alert.alert('Недостаточно средств', 'У вас недостаточно на балансе для оплаты заказа');
                navigation.navigate('Wallet');
                return;
            }
        }
    }, [selectedPayment, count12, count19, price12, price19, user?.balance]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <Back navigation={navigation} title="Оформление заказа" />
            <ScrollView 
                ref={scrollViewRef}
                style={styles.container}
                contentContainerStyle={{ paddingBottom: scrollPaddingBottom }}
            >
                <View>
                    {products.b12 >= 0 && (
                        <View style={styles.productContainer}>
                            <View style={styles.productTop}>
                                <View style={styles.product}>
                                    <View>
                                        <Image source={require('../assets/bottleProduct12.png')} style={styles.productImage} />
                                    </View>
                                    <View>
                                        <Text style={styles.productTitle}>Вода 12,5 л</Text>
                                        <Text style={styles.productSubtitle}>Негазированная</Text>
                                    </View>
                                </View>
                                <View style={styles.productBottoms}>
                                    <TouchableOpacity 
                                        style={styles.productBottomsPlusMinus}
                                        onPress={() => {
                                            if (count12 > 0) {
                                                setCount12(count12 - 1);
                                            }
                                        }}
                                    >
                                        <Image source={require('../assets/minus.png')} style={styles.productBottomsIcon} />
                                    </TouchableOpacity>
                                    <Text style={styles.productBottomsCount}>{count12}</Text>
                                    <TouchableOpacity 
                                        style={styles.productBottomsPlusMinus}
                                        onPress={() => {
                                            setCount12(count12 + 1);
                                        }}
                                    >
                                        <Image source={require('../assets/plus.png')} style={styles.productBottomsIcon} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={{height: 1, backgroundColor: '#E3E3E3', marginVertical: 12, width: '100%' }} />
                            <View style={styles.productBottom}>
                                <View style={styles.productBottomTitle}>
                                    <Text>Цена:</Text>
                                    <Text>Итого:</Text>
                                </View>
                                <View style={styles.productBottomSum}>
                                    <Text>{price12} ₸</Text>
                                    <Text style={{color: "#DC1818"}}>{count12 * price12} ₸</Text>
                                </View>
                            </View>
                        </View>
                    )}
                    {products.b19 >= 0 && (
                        <View style={styles.productContainer}>
                            <View style={styles.productTop}>
                                <View style={styles.product}>
                                    <View>
                                        <Image source={require('../assets/bottleProduct.png')} style={styles.productImage} />
                                    </View>
                                    <View>
                                        <Text style={styles.productTitle}>Вода 18,9 л</Text>
                                    </View>
                                </View>
                                <View style={styles.productBottoms}>
                                    <TouchableOpacity 
                                        style={styles.productBottomsPlusMinus}
                                        onPress={() => {
                                            if (count19 > 0) {
                                                setCount19(count19 - 1);
                                            }
                                        }}
                                    >
                                        <Image source={require('../assets/minus.png')} style={styles.productBottomsIcon} />
                                    </TouchableOpacity>
                                    <Text style={styles.productBottomsCount}>{count19}</Text>
                                    <TouchableOpacity 
                                        style={styles.productBottomsPlusMinus}
                                        onPress={() => {
                                            setCount19(count19 + 1);
                                        }}
                                    >
                                        <Image source={require('../assets/plus.png')} style={styles.productBottomsIcon} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={{height: 1, backgroundColor: '#E3E3E3', marginVertical: 12, width: '100%' }} />
                            <View style={styles.productBottom}>
                                <View style={styles.productBottomTitle}>
                                    <Text>Цена:</Text>
                                    <Text>Итого:</Text>
                                </View>
                                <View style={styles.productBottomSum}>
                                    <Text>{price19} ₸</Text>
                                    <Text style={{color: "#DC1818"}}>{count19 * price19} ₸</Text>
                                </View>
                            </View>
                        </View>
                    )}


                    {count12 > 0 && count19 > 0 && (
                        <View style={{marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: "flex-end", gap: 16}}>
                            <Text style={{fontSize: 18, fontWeight: '500', color: '#101010'}}>Общая сумма:</Text>
                            <Text style={{color: "#DC1818", fontSize: 16, fontWeight: '600'}}>{count12 * price12 + count19 * price19} ₸</Text>
                        </View>
                    )}

                    <TouchableOpacity style={[styles.additionalInfo, {marginTop: 32}]} onPress={() => setDateModalVisible(true)}>
                        <View>
                            <Text style={{
                                fontWeight: '500',
                                color: '#99A3B3',
                                fontSize: selectedDate ? 14 : 16,
                                transform: selectedDate ? [{translateY: -8}] : [],
                            }}>
                                Дата доставки
                            </Text>
                            {selectedDate && <Text style={{fontSize: 18, fontWeight: '500'}}> {selectedDate?.label}</Text>}
                        </View>
                        <Image source={require('../assets/arrowDown.png')} style={{width: 24, height: 24}} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.additionalInfo, {marginTop: 24}]} onPress={() => setAddressModalVisible(true)}>
                        <View>
                            <Text style={{
                                fontWeight: '500',
                                color: '#99A3B3',
                                fontSize: selectedAddress ? 14 : 16,
                                transform: selectedAddress ? [{translateY: -8}] : [],
                            }}>
                                Адрес доставки
                            </Text>
                            {selectedAddress && <Text style={{fontSize: 18, fontWeight: '500'}}> {selectedAddress?.name}</Text>}
                        </View>
                        <Image source={require('../assets/arrowDown.png')} style={{width: 24, height: 24}} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.additionalInfo, {marginTop: 24}]} onPress={() => setPaymentModalVisible(true)}>
                        <View>
                            <Text style={{
                                fontWeight: '500',
                                color: '#99A3B3',
                                fontSize: selectedPayment ? 14 : 16,
                                transform: selectedPayment ? [{translateY: -8}] : [],
                            }}>Способ оплаты</Text>
                            {selectedPayment && <Text style={{fontSize: 18, fontWeight: '500'}}> {selectedPayment?.label}</Text>}
                        </View>
                        <Image source={require('../assets/arrowDown.png')} style={{width: 24, height: 24}} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.additionalInfo, {marginTop: 24}]} onPress={() => setCallModalVisible(true)}>
                        <View>
                            <Text style={{
                                fontWeight: '500',
                                color: '#99A3B3',
                                fontSize: selectedCall ? 14 : 16,
                                transform: selectedCall ? [{translateY: -8}] : [],
                            }}>Звонок курьера перед доставкой</Text>
                            {selectedCall && <Text style={{fontSize: 18, fontWeight: '500'}}> {selectedCall?.label}</Text>}
                        </View>
                        <Image source={require('../assets/arrowDown.png')} style={{width: 24, height: 24}} />
                    </TouchableOpacity>

                <View 
                    style={[styles.additionalInfo, {marginTop: 24}]}
                    onLayout={(event) => {
                        const { y } = event.nativeEvent.layout;
                        setCommentInputY(y);
                    }}
                >
                    <TextInput
                        ref={commentInputRef}
                        style={{
                            fontSize: 16,
                            color: '#101010',
                            minHeight: 64,
                            textAlignVertical: 'top',
                            width: '100%',
                            borderWidth: 1,
                            borderColor: '#E3E3E3',
                            borderRadius: 12,
                            padding: 12,
                            backgroundColor: '#F8F8F8',
                        }}
                        value={comment}
                        onChangeText={setComment}
                        placeholder="Комментарий для курьера..."
                        multiline={true}
                        numberOfLines={4}
                        maxLength={400}
                        onFocus={() => {
                            setScrollPaddingBottom(300);
                            setTimeout(() => {
                                if (scrollViewRef.current && commentInputY > 0) {
                                    scrollViewRef.current.scrollTo({
                                        y: commentInputY - 100,
                                        animated: true,
                                    });
                                }
                            }, 100);
                        }}
                        onBlur={() => {
                            setScrollPaddingBottom(0);
                        }}
                    />
                </View>

                </View>

                <TouchableOpacity style={styles.button} onPress={handleOrder} disabled={loading} >
                    {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.buttonText}>Оформить заказ</Text>}
                </TouchableOpacity>

                <View style={{height: 80}} />
            </ScrollView>


            <Modal
                visible={addressModalVisible}
                onRequestClose={() => setAddressModalVisible(false)}
                transparent={true}
                animationType="fade"
            >
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setAddressModalVisible(false)}>
                    <TouchableOpacity style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
                        <Text style={{fontSize: 24, fontWeight: '600', color: '#101010', marginBottom: 16, textAlign: 'center'}}>Выберите адрес доставки</Text>
                        {user?.addresses?.map((address, index) => (
                            <TouchableOpacity key={address._id || index} style={styles.modalAddress} onPress={() => {
                                if (selectedAddress?.name === address.name) {
                                    setSelectedAddress(null);
                                } else {
                                    setSelectedAddress(address);
                                    setAddressModalVisible(false);
                                }
                            }}>
                                <Text style={styles.modalAddressText}>{address.name}</Text>
                                <View style={{ justifyContent: 'center', alignItems: 'center', width: 16, height: 16, borderRadius: "50%", borderWidth: 1, borderColor: selectedAddress?._id === address._id ? '#DC1818' : '#101010' }}>
                                    {selectedAddress?.name === address.name && <View style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: '#DC1818' }} />}
                                </View>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity style={[styles.button, {marginTop: 40}]} onPress={() => {
                            setAddressModalVisible(false);
                            if (!user) {
                                navigation.navigate('Login');
                            } else {
                                navigation.navigate('AddOrUpdateAddress', { address: null });
                            }
                        }}>
                            <Text style={styles.buttonText}>Добавить адрес</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={paymentModalVisible}
                onRequestClose={() => setPaymentModalVisible(false)}
                transparent={true}
                animationType="fade"
            >
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setPaymentModalVisible(false)}>
                    <TouchableOpacity style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
                        <Text style={{fontSize: 24, fontWeight: '600', color: '#101010', marginBottom: 16, textAlign: 'center'}}>Способ оплаты</Text>
                        {payments.map((payment) => (
                            <TouchableOpacity key={payment.value} style={styles.modalAddress} onPress={() => {
                                if (selectedPayment?.value === payment?.value) {
                                    setSelectedPayment(null);
                                } else {
                                    setSelectedPayment(payment);
                                    setPaymentModalVisible(false);
                                }
                            }}>
                                <Text style={styles.modalAddressText}>{payment?.label}</Text>
                                <View style={{ justifyContent: 'center', alignItems: 'center', width: 16, height: 16, borderRadius: "50%", borderWidth: 1, borderColor: selectedPayment?.value === payment?.value ? '#DC1818' : '#101010' }}>
                                    {selectedPayment?.value === payment?.value && <View style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: '#DC1818' }} />}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={callModalVisible}
                onRequestClose={() => setCallModalVisible(false)}
                transparent={true}
                animationType="fade"
            >
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setCallModalVisible(false)}>
                    <TouchableOpacity style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
                        <Text style={{fontSize: 24, fontWeight: '600', color: '#101010', marginBottom: 16, textAlign: 'center'}}>Нужен ли звонок от курьера?</Text>
                        {calls.map((call, index) => (
                            <TouchableOpacity key={call.label || index} style={styles.modalAddress} onPress={() => {
                                setSelectedCall(call)
                                setCallModalVisible(false)
                            }}>
                                <Text style={styles.modalAddressText}>{call.label}</Text>
                                <View style={{ justifyContent: 'center', alignItems: 'center', width: 16, height: 16, borderRadius: "50%", borderWidth: 1, borderColor: selectedCall?.value === call?.value ? '#DC1818' : '#101010' }}>
                                    {selectedCall?.value === call?.value && <View style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: '#DC1818' }} />}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={dateModalVisible}
                onRequestClose={() => setDateModalVisible(false)}
                transparent={true}
                animationType="fade"
            >
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setDateModalVisible(false)}>
                    <TouchableOpacity style={[styles.modalContainer, {maxHeight: '70%'}]} onPress={(e) => e.stopPropagation()}>
                        <Text style={{fontSize: 24, fontWeight: '600', color: '#101010', marginBottom: 16, textAlign: 'center'}}>Выберите дату доставки</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {availableDates.map((date, index) => (
                                <TouchableOpacity key={date.value || index} style={styles.modalAddress} onPress={() => {
                                    setSelectedDate(date);
                                    setDateModalVisible(false);
                                }}>
                                    <Text style={styles.modalAddressText}>{date.label}</Text>
                                    <View style={{ justifyContent: 'center', alignItems: 'center', width: 16, height: 16, borderRadius: "50%", borderWidth: 1, borderColor: selectedDate?.value === date?.value ? '#DC1818' : '#101010' }}>
                                        {selectedDate?.value === date?.value && <View style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: '#DC1818' }} />}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'white',
    },
    container: {
        flex: 1,
        backgroundColor: '#f6f6f6',
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 40,
    },
    productContainer: {
        marginTop: 16,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    productTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    product: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    productImage: {
        width: 40,
        height: 60,
    },
    productTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#101010',
    },
    productSubtitle: {
        fontSize: 12,
        fontWeight: '500',
        color: '#101010',
    },
    productBottoms: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 8,
        borderWidth: 1,
        borderColor: '#E3E3E3',
        borderRadius: 12,
    },
    productBottomsPlusMinus: {
        padding: 6
    },
    productBottomsIcon: {
        width: 16,
        height: 16,
    },
    productBottomsCount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#99A3B3',
    },
    productBottom: {
    },
    productBottomTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 14,
        fontWeight: '500',
        color: '#545454',
    },
    productBottomSum: {
        marginTop: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 16,
        fontWeight: '600',
        color: '#101010',
    },
    additionalInfo: {
        backgroundColor: 'white',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 20,
        borderWidth: 1,
        borderColor: '#EDEDED',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    modalAddress: {
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#EDEDED',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    modalAddressText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#101010',
    },
    button: {
        backgroundColor: '#DC1818',
        padding: 16,
        borderRadius: 8,
        marginTop: 40,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});


export default AddOrderScreen;