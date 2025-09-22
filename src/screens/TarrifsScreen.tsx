import { SafeAreaView, StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { Back } from '../components';
import { useState } from 'react';
import { useAuth } from '../hooks';


const TarrifsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const userTarrif = "Light";
    const tarrifs = [
        {
            title: 'Standard',
            price: "0 ₸",
            subtitle: 'Базовый тариф для удобного и быстрого заказа воды',
            features: ['Оформление заказа в пару кликов', 'Быстрая доставка в течение дня', 'Без возможности выбора точной даты и времени доставки']
        },
        {
            title: 'Light',
            price: "5 999 ₸ / мес",
            subtitle: 'Комфорт и гибкость в каждом заказе',
            features: ['Все функции тарифа Standart', 'Время доставки устанавливается автоматически', 'Возможность выбрать дату доставки']
        },
        {
            title: 'Premium',
            price: "9 999 ₸ / мес",
            subtitle: 'Расширенный тариф для тех, кто ценит точность и комфорт',
            features: ['Все функции тарифов Standart и Light', 'Приоритетная обработка заказов', 'Выбор точной даты и времени доставки']
        },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <Back navigation={navigation} title="Тарифы" />
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {tarrifs.map((tarrif) => (
                    <View key={tarrif.title} style={[styles.tarrifCard, {borderColor: userTarrif === tarrif.title ? "#DC1818" : "#E3E3E3", borderWidth: userTarrif === tarrif.title ? 1 : 0}]}>
                        <View style={styles.tarrifCardHeader}>
                            <Text style={styles.tarrifCardTitle}>{tarrif.title}</Text>
                            <View style={styles.tarrifCardPriceContainer}>
                                <Text style={styles.tarrifCardPrice}>{tarrif.price}</Text>
                            </View>
                        </View>
                        <View style={{height: 1, backgroundColor: '#E3E3E3', marginTop: 8, marginBottom: 12}} />
                        <Text style={styles.tarrifCardSubtitle}>
                            {tarrif.subtitle}
                        </Text>
                        {tarrif.features.map((feature) => (
                            <View key={feature} style={styles.tarrifCardFeatures}>
                                <View style={styles.tarrifCardFeatureDot} />
                                <Text style={styles.tarrifCardFeatureText}>{feature}</Text>
                            </View>
                        ))}
                        {userTarrif !== tarrif.title && (
                            <TouchableOpacity style={styles.tarrifCardButton}>
                                <Text style={styles.tarrifCardButtonText}>Сменить тариф</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
                <View style={{height: 40}} />
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
        paddingBottom: 100,
    },
    tarrifCard: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 2,
        elevation: 5,
    },
    tarrifCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tarrifCardTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    tarrifCardPriceContainer: {
        width: 130,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E3E3E3',
    },
    tarrifCardPrice: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
    tarrifCardSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#545454',
        marginBottom: 12,
    },
    tarrifCardFeatures: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 4,
        marginLeft: 8,
    },
    tarrifCardFeatureDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#545454',
        marginTop: 8,
    },
    tarrifCardFeatureText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#545454',
    },
    tarrifCardButton: {
        marginTop: 24,
        backgroundColor: '#DC1818',
        padding: 12,
        borderRadius: 8,
    },
    tarrifCardButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});


export default TarrifsScreen;