import { SafeAreaView, StyleSheet, Text, ScrollView, View, Image, TouchableOpacity } from "react-native";
import { Back } from "../components";

const HowToTopUpScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <Back navigation={navigation} title="Что такое мой баланс?" />
            <ScrollView style={{}} showsVerticalScrollIndicator={false}>
                <View style={{
                    backgroundColor: '#FDD5D5',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <Image source={require('../assets/howToTopUp.png')} style={styles.image} />
                </View>
                
                <View style={styles.container}>
                    <Text style={styles.title}>Как пополнить баланс</Text>
                    <View style={{height: 1, backgroundColor: '#E3E3E3', marginVertical: 6, width: '100%' }} />

                    <View style={[styles.feature, { marginTop: 8 }]}>
                        <Text style={styles.featureNumber}>1.</Text>
                        <Text style={styles.featureText}>
                            Откройте раздел «Мой баланс» в приложении.
                        </Text>
                    </View>

                    <View style={styles.feature}>
                        <Text style={styles.featureNumber}>2.</Text>
                        <Text style={styles.featureText}>
                            Нажмите кнопку «Пополнить».
                        </Text>
                    </View>

                    <View style={[styles.feature, { marginTop: 8 }]}>
                        <Text style={styles.featureNumber}>3.</Text>
                        <Text style={styles.featureText}>
                            Выберите удобный способ оплаты: банковская карта, Kaspi, QR-код или другой доступный вариант.
                        </Text>
                    </View>

                    <View style={styles.feature}>
                        <Text style={styles.featureNumber}>4.</Text>
                        <Text style={styles.featureText}>
                            Укажите сумму и подтвердите оплату.
                        </Text>
                    </View>
                    <View style={{height: 1, backgroundColor: '#E3E3E3', marginVertical: 6, width: '100%' }} />

                    <Text style={[styles.title, { marginTop: 20 }]}>Безопасность операций</Text>
                    <Text style={[styles.subtitle, { marginTop: 8 }]}>
                        Все платежи проходят через защищённые сервисы.{'\n'}
                        Ваши данные надёжно шифруются и не передаются третьим лицам.
                    </Text>
                    <View style={{height: 1, backgroundColor: '#E3E3E3', marginVertical: 6, width: '100%' }} />

                    <Text style={[styles.title, { marginTop: 20 }]}>Советы</Text>
                    <View style={[styles.feature, { marginTop: 8 }]}>
                        <View style={styles.featureDot} />
                        <Text style={styles.featureText}>
                            Пополняйте баланс заранее, чтобы не тратить время при заказе.
                        </Text>
                    </View>

                    <View style={styles.feature}>
                        <View style={styles.featureDot} />
                        <Text style={styles.featureText}>
                            При возникновении вопросов вы всегда можете обратиться в службу поддержки.
                        </Text>
                    </View>

                    <Text style={[styles.title, { marginTop: 20 }]}>Забота о вас</Text>
                    <Text style={[styles.subtitle, { marginTop: 8 }]}>
                        Мы стремимся сделать доставку «Тибетской воды» максимально удобной.{'\n'}
                        Пополните баланс и свежая, чистая вода будет всегда под рукой, когда вам нужно.
                    </Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.button}>
                            <Text style={styles.buttonText}>Пополнить</Text>
                        </TouchableOpacity>
                    </View>
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
        width: 100,
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
    featureNumber: {
        fontSize: 18,
        fontWeight: '500',
        color: '#4D4353',
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
        paddingBottom: 20,
        marginTop: 10,
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


export default HowToTopUpScreen;