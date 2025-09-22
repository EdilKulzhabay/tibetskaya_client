import { SafeAreaView, StyleSheet, Text, ScrollView, View, Image, TouchableOpacity } from 'react-native';
import { Back } from '../../components';
import { useAuth } from '../../hooks';

const TakePartHydrationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {


    const { updateUser } = useAuth();
    const handleStartHydration = async () => {
        navigation.navigate('StartHydration');
        await updateUser('isStartedHydration', true).then(() => {
            navigation.navigate('StartHydration');
        }).catch((error) => {
            console.log(error);
        });
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <Back navigation={navigation} title="Принять участие в гидратации" />
            
            <ScrollView style={{}} showsVerticalScrollIndicator={false}>
                <View style={styles.imageContainer}>
                    <Image source={require('../../assets/bannerBottle2.png')} style={styles.image} />
                </View>
                <View style={styles.container}>
                    <Text style={styles.title}>Выпей 3 бутылки воды</Text>
                    <Text style={styles.subtitle}>Пополни водный баланс</Text>
                    <View style={{height: 1, backgroundColor: '#E3E3E3', marginVertical: 6, width: '100%' }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                        <Text style={{ fontSize: 18, fontWeight: '600' }}>Награда:</Text>
                        <Text style={{ fontSize: 16, fontWeight: '500', color: '#DC1818', marginLeft: 4 }}>50</Text>
                        <Image source={require('../../assets/present.png')} style={{ width: 24, height: 24 }} />
                    </View>

                    <Text style={styles.title}>Цель:</Text>
                    <Text style={[styles.subtitle, { marginTop: 8 }]}>Поддерживать водный баланс организма, улучшить самочувствие и выработать полезную привычку — выпивать 3 бутылки воды в день.</Text>

                    <Text style={[styles.title, { marginTop: 12 }]}>Как принять участие:</Text>

                    <View style={[styles.feature, { marginTop: 8 }]}>
                        <View style={styles.featureDot} />
                        <Text style={styles.featureText}>В течение дня выпейте 3 бутылки воды (объём одной бутылки — 500 мл).</Text>
                    </View>

                    <View style={styles.feature}>
                        <View style={styles.featureDot} />
                        <Text style={styles.featureText}>После каждой бутылки отмечайте прогресс в приложении.</Text>
                    </View>

                    <View style={styles.feature}>
                        <View style={styles.featureDot} />
                        <Text style={styles.featureText}>Завершите миссию до конца дня, чтобы получить награду.</Text>
                    </View>

                    <Text style={[styles.subtitle, { marginTop: 12 }]}>Чтобы принять участие нажмите кнопку “Участвовать”</Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.button} onPress={handleStartHydration}>
                            <Text style={styles.buttonText}>Участвовать!</Text>
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
        paddingHorizontal: 24,
        paddingVertical: 32,
    },
    imageContainer: {
        backgroundColor: '#D2E9FF',
        padding: 20
    },
    image: {
        width: '100%',
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


export default TakePartHydrationScreen;