import { StyleSheet } from "react-native";
import {SafeAreaView} from 'react-native-safe-area-context';
import {androidOnlySafeAreaEdges} from '../utils/safeArea';
import { Back } from "../components";

const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.safeArea} edges={androidOnlySafeAreaEdges}>
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