import { SafeAreaView, StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Back } from '../../components';
import OutlinedFilledLabelInput from '../../components/OutlinedFilledLabelInput';
import { useState } from 'react';

const StartHydrationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {

    const [plannedVolume, setPlannedVolume] = useState('');

    const handleSave = () => {
        console.log(plannedVolume);
        navigation.navigate('Hydration');
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <Back navigation={navigation} title="Дневная цель" />
            <View style={styles.container}>
                <View style={styles.hydrationContainer}>
                    <Image source={require('../../assets/emptyHydration.png')} style={styles.hydrationImage} />
                    <View style={{marginTop: 56, width: '100%', paddingHorizontal: 24}}>
                        <OutlinedFilledLabelInput 
                            label="Планируемый объем в мл."
                            value={plannedVolume}
                            onChangeText={(text) => setPlannedVolume(text)}
                            bgWhite={true}
                        />
                    </View>
                </View>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={handleSave}>
                        <Text style={styles.buttonText}>Сохранить</Text>
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