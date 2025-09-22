import { SafeAreaView, StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Back } from '../../components';

const StartHydrationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {

    return (
        <SafeAreaView style={styles.safeArea}>
            <Back navigation={navigation} title="Начать гидратацию" />
            <View style={styles.container}>
                <View style={styles.hydrationContainer}>
                    <Image source={require('../../assets/emptyHydration.png')} style={styles.hydrationImage} />
                    <Text style={styles.title}>Установи дневную цель</Text>
                    <Text style={styles.subtitle}>Чтобы начать отслеживать прогресс, установи дневную цель по водному балансу</Text>
                </View>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('StartHydration2')}>
                        <Text style={styles.buttonText}>Начать</Text>
                    </TouchableOpacity>
                </View>
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
        backgroundColor: '#f6f6f6',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    hydrationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
    },
    hydrationImage: {
        width: 250,
        height: 250,
    },
    title: {
        marginTop: 26,
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
        textAlign: 'center',
    },
    subtitle: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '500',
        color: '#545454',
        textAlign: 'center',
    },
    buttonContainer: {
    },
    button: {
        backgroundColor: '#DC1818',
        padding: 16,
        borderRadius: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
});


export default StartHydrationScreen;