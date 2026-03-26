import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import StableImage from './StableImage';

const Products: React.FC<{ navigation: any, price19: number, price12: number}> = ({ navigation, price19 }) => {
    const [count12, setCount12] = useState(0);
    const [count19, setCount19] = useState(0);

    // Логируем изменения счетчиков и условие показа кнопки
    const shouldShowButton = count12 > 1 || count19 > 1 || (count12 > 0 && count19 > 0);
    console.log('📊 Счетчики - 12.5л:', count12, '18.9л:', count19, '| Показать кнопку:', shouldShowButton);

    const handleOrder = () => {
        console.log('🛒 handleOrder вызван');
        console.log('📦 count12:', count12, 'count19:', count19);
        console.log('🧭 navigation:', navigation);
        
        try {
            navigation.navigate('AddOrder', { products: { b12: count12, b19: count19 }, order: null });
            console.log('✅ navigate вызван успешно');
        } catch (error) {
            console.error('❌ Ошибка навигации:', error);
        }
    }

    return (
        <View>
            <View style={styles.containerTitle}>
                <Text style={styles.title}>Товары</Text>
                {/* <TouchableOpacity>
                    <Text style={styles.button}>смотреть все</Text>
                </TouchableOpacity> */}
            </View>
            {/* <View style={styles.productContainer}>
                <View style={styles.productTop}>
                    <View style={styles.product}>
                        <View style={styles.productImageContainer}>
                            <StableImage source={require('../assets/bottleProduct12.png')} style={styles.productImage} />
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
                        <Text>900 ₸</Text>
                        <Text>{count12 * 900} ₸</Text>
                    </View>
                </View>
            </View> */}

            <View style={styles.productContainer}>
                <View style={styles.productTop}>
                    <View style={styles.product}>
                        <View style={styles.productImageContainer}>
                            <StableImage source={require('../assets/bottleProduct.png')} style={styles.productImage} />
                        </View>
                        <View>
                            <Text style={styles.productTitle}>Вода 18,9 л</Text>
                            <Text style={styles.productSubtitle}>Негазированная</Text>
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
                        <Text style={styles.productBottomTitleText}>Цена:</Text>
                        <Text style={styles.productBottomTitleText}>Итого:</Text>
                    </View>
                    <View style={styles.productBottomSum}>
                        <Text style={styles.productBottomSumText}>{price19} ₸</Text>
                        <Text style={styles.productBottomSumText}>{count19 * price19} ₸</Text>
                    </View>
                </View>
            </View>

            {!shouldShowButton && count19 > 0 && (
                <View style={{
                    marginTop: 4,
                }}>
                    <Text style={{
                        textAlign: 'right',
                        fontSize: 14,
                        fontWeight: '500',
                        color: '#DC1818',
                    }}
                    >Минимальный заказ 2 бутыля.</Text>
                </View>
            )}

            {shouldShowButton && (
                <View style={styles.order}>
                    <TouchableOpacity 
                        style={styles.orderButton} 
                        onPress={() => {
                            console.log('🔴 Кнопка "Заказать" нажата!');
                            handleOrder();
                        }}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.orderButtonText}>Заказать</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    containerTitle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#101010',
    },
    button: {
        fontSize: 14,
        fontWeight: '700',
        color: '#DC1818',
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
    productImageContainer: {
        width: 40,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
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
    },
    productBottomTitleText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#545454',
    },
    productBottomSum: {
        marginTop: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    productBottomSumText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#101010',
    },
    order: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 16,
        zIndex: 999, // Убедимся что кнопка поверх всего
    },
    orderButton: {
        backgroundColor: '#DC1818',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        minHeight: 40, // Увеличим область нажатия
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: 'white',
    },
});

export default Products;