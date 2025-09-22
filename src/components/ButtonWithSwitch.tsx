import { Image, ImageSourcePropType, StyleSheet, Switch, Text, View } from "react-native";
import MySwitchToggle from "./MySwitchToggle";


interface NavButtonProps {
    title: string;
    icon: ImageSourcePropType;
    switchValue: boolean;
    onSwitchChange: () => void;
}

const ButtonWithSwitch: React.FC<NavButtonProps> = ({ title, icon, switchValue, onSwitchChange }) => {
    return (
        <View style={styles.container}>
            <View style={styles.leftElements}>
                {icon && <Image source={icon} style={styles.icon} />}
                <Text style={styles.title}>{title}</Text>
            </View>
            <MySwitchToggle value={switchValue} onPress={onSwitchChange} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        marginTop: 12,
    },
    leftElements: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16
    },
    icon: {
        width: 24,
        height: 24,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
    },
});


export default ButtonWithSwitch;