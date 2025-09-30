import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, OrderData, OrderProduct, Courier, OrderDate, CourierAggregator } from '../types/navigation';
import { OrderAddress } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface OrderBlockProps {
    _id: string;
    date: OrderDate;
    status: 'awaitingOrder' | 'confirmed' | 'preparing' | 'onTheWay' | 'delivered' | 'cancelled';
    products: OrderProduct;
    courier?: Courier | string;
    address: OrderAddress;
    totalAmount: number;
    courierAggregator?: CourierAggregator | string;
}

const OrderBlock: React.FC<OrderBlockProps> = ({_id, date, status, products, courier, address, totalAmount, courierAggregator}) => {
    const navigation = useNavigation<NavigationProp>();
    
    // Создаем объект заказа для передачи
    const orderData: OrderData = {
        _id,
        date,
        status,
        products,
        courier,
        address,
        sum: totalAmount,
        courierAggregator,
        totalAmount,
        history: [],
        transferred: false,
        clientReview: 0,
        clientNotes: [],
        income: 0,
        aquaMarketAddress: '',
        reason: '',
        forAggregator: false,
        priority: 3,
        isUrgent: false,
        clientPhone: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const handleOrderPress = () => {
        navigation.navigate('OrderStatus', { order: orderData });
    };

    return (
        <TouchableOpacity style={styles.container} onPress={handleOrderPress}>
            <View style={styles.orderHeader}>
                <Text># <Text style={{fontSize: 18, fontWeight: '600'}}>
                  {typeof date === 'string' ? date : date?.d || 'Не указана'}
                </Text></Text>
                <Text style={
                    [styles.orderStatus, 
                    status === "awaitingOrder" || status === "onTheWay" ? { color: "#EB7E00" } : 
                    status === "delivered" ? { color: "#00B01A" } : { color: "#DC1818" }]
                }>{status === "awaitingOrder" ? "Ожидает заказа" : status === "onTheWay" ? "В пути" : status === "delivered" ? "Принято" : "Отменено"}</Text>
            </View>
            <View style={{height: 1, backgroundColor: '#E3E3E3', marginVertical: 12, width: '100%' }} />
            <View style={styles.orderBody}>
                <View style={styles.orderProduct}>
                    {products && products.b12 > 0 && (
                        <Text>{products.b12}x Вода 12,5 л</Text>
                    )}
                    {products && products.b19 > 0 && (
                        <Text>{products.b19}x Вода 18,9 л</Text>
                    )}
                </View>

                {courierAggregator && typeof courierAggregator === 'object' && courierAggregator.fullName && status !== "awaitingOrder" && (
                    <View style={styles.orderCourier}>
                        {status === "onTheWay" ? (
                            <Text>К вам едет: </Text>
                        ) : (
                            <Text>Доставил курьер: </Text>
                        )}
                        <Text style={styles.orderCourierName}>{courierAggregator.fullName}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
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
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderBody: {
    },
    orderStatus: {
        fontSize: 14,
        fontWeight: '600',
    },
    orderProduct: {
        fontSize: 14,
        color: '#545454',
        fontWeight: '500',
        gap: 8
    },
    orderCourier: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        fontSize: 14,
        color: '#545454',
        fontWeight: '500',
        gap: 8
    },
    orderCourierName: {
        fontSize: 16,
        color: '#000',
        fontWeight: '600',
    },
});

export default OrderBlock;