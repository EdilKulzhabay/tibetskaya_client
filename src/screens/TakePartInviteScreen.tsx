import { SafeAreaView, StyleSheet, Text, ScrollView, View, Image, TouchableOpacity } from 'react-native';
import { Back } from '../components';

const TakePartInviteScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <Back navigation={navigation} title="Принять участие в приглашении" />
            {/* <View style={styles.imageContainer}> */}
                
            {/* </View> */}
            <ScrollView style={{}} showsVerticalScrollIndicator={false}>
                <Image source={require('../assets/invite.png')} style={styles.image} />
                <View style={styles.container}>
                    <Text style={styles.title}>Пригласи друзей</Text>
                    <Text style={styles.subtitle}>Делись ссылкой и расскажи о нас друзьям!</Text>
                    <View style={{height: 1, backgroundColor: '#E3E3E3', marginVertical: 6, width: '100%' }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                        <Text style={{ fontSize: 18, fontWeight: '600' }}>Награда:</Text>
                        <Text style={{ fontSize: 16, fontWeight: '500', color: '#DC1818', marginLeft: 4 }}>10</Text>
                        <Image source={require('../assets/present.png')} style={{ width: 24, height: 24 }} />
                    </View>

                    <Text style={[styles.title, { marginTop: 20 }]}>Цель:</Text>
                    <Text style={[styles.subtitle, { marginTop: 8 }]}>Помоги нам расти — расскажи друзьям о приложении и пригласи их присоединиться. Делись пользой и получай награды!</Text>

                    <Text style={[styles.title, { marginTop: 20 }]}>Как принять участие:</Text>

                    <View style={[styles.feature, { marginTop: 8 }]}>
                        <View style={styles.featureDot} />
                        <Text style={styles.featureText}>
                            Скопируйте персональную ссылку-приглашение.
                        </Text>
                    </View>

                    <View style={styles.feature}>
                        <View style={styles.featureDot} />
                        <Text style={styles.featureText}>
                            Поделитесь ссылкой с друзьями в мессенджерах, соцсетях или где удобно.
                        </Text>
                    </View>

                    <View style={styles.feature}>
                        <View style={styles.featureDot} />
                        <Text style={styles.featureText}>
                            Как только друг установит приложение и зарегистрируется по вашей ссылке, миссия будет засчитана.
                        </Text>
                    </View>

                    <View style={styles.feature}>
                        <View style={styles.featureDot} />
                        <Text style={styles.featureText}>
                            Получите награду за каждого приглашённого друга!
                        </Text>
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.button}>
                            <Text style={styles.buttonText}>Отправить ссылку!</Text>
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
        backgroundColor: '#FDD5D5',
        padding: 20,
        paddingLeft: 50
    },
    image: {
        width: '100%',
        height: 300,
        resizeMode: 'cover',
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


export default TakePartInviteScreen;