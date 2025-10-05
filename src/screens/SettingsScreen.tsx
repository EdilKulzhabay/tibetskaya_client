import { SafeAreaView, StyleSheet } from "react-native";
import { Back } from "../components";

const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <Back navigation={navigation} title="Настройки" />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'white',
    },
});


export default SettingsScreen;