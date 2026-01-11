import { SafeAreaView, StyleSheet, Text, ScrollView, View, Image, TouchableOpacity } from "react-native";
import { Back } from "../components";

const WhatIsMyBalanceScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <Back navigation={navigation} title="Что такое мой баланс?" />
            <ScrollView style={{}} showsVerticalScrollIndicator={false}>
                <View style={{
                    backgroundColor: '#FDD5D5',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <Image source={require('../assets/whatIsMyBalance.png')} style={styles.image} />
                </View>
                
                <View style={styles.container}>
                    <Text style={styles.title}>Мой баланс</Text>
                    <Text style={styles.subtitle}>Это ваш личный счёт в приложении «Тибетская».</Text>
                    <View style={{height: 1, backgroundColor: '#E3E3E3', marginVertical: 6, width: '100%' }} />

                    <Text style={[styles.title, { marginTop: 20 }]}>Как это работает?</Text>
                    <Text style={[styles.subtitle, { marginTop: 8 }]}>
                        Пополните баланс заранее и сможете оформить заказ в один клик.{'\n'}
                        Средства списываются автоматически при оформлении заказа.{'\n'}
                        Остаток сохраняется и доступен для последующих покупок.
                    </Text>
                    <View style={{height: 1, backgroundColor: '#E3E3E3', marginVertical: 6, width: '100%' }} />

                    <Text style={[styles.title, { marginTop: 20 }]}>Почему это удобно?</Text>
                    <Text style={[styles.subtitle, { marginTop: 8 }]}>
                        Быстрая оплата без ожидания сдачи или перевода.{'\n'}
                        Все операции прозрачны и доступны в истории заказов.{'\n'}
                        Средства на балансе не сгорают и всегда под рукой.
                    </Text>
                    <View style={{height: 1, backgroundColor: '#E3E3E3', marginVertical: 6, width: '100%' }} />

                    <Text style={[styles.title, { marginTop: 20 }]}>Забота о вашем комфорте</Text>
                    <Text style={[styles.subtitle, { marginTop: 8 }]}>
                        Мы ценим ваше доверие и хотим, чтобы заказ «Тибетской воды» был максимально лёгким.{'\n'}
                        Следите за балансом, пополняйте при необходимости{'\n'}
                        и наслаждайтесь чистотой и свежестью «Тибетской воды» каждый день.
                    </Text>
                </View>
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
        paddingTop: 16,
        paddingBottom: 32,
        paddingHorizontal: 24,
    },
    image: {
        width: 306,
        resizeMode: 'contain',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '500',
        color: '#4D4353',
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 4,
        marginLeft: 8,
    },
    featureDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#545454',
        marginTop: 8,
    },
    featureText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#4D4353',
    },
    buttonContainer: {
        padding: 20,
        paddingBottom: 40,
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


export default WhatIsMyBalanceScreen;