import { Image, StyleSheet, Text, TouchableOpacity, View, ImageSourcePropType } from "react-native";
import StableImage from './StableImage';

interface NavButtonProps {
    title: string;
    onPress: () => void;
    additioinalText?: string;
    icon: ImageSourcePropType;
}

const NavButton: React.FC<NavButtonProps> = ({ title, onPress, additioinalText, icon }) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.leftElements}>
                {icon && <StableImage source={icon} style={styles.icon} />}
                <Text style={styles.title}>{title}</Text>
            </View>
            <View style={styles.rightElements}>
                {additioinalText && <Text style={styles.additioinalText}>{additioinalText}</Text>}
                <StableImage source={require('../assets/arrowRight.png')} style={styles.arrowRight} />
            </View>
        </TouchableOpacity>
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
    rightElements: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    additioinalText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#828282',
    },
    arrowRight: {
        width: 24,
        height: 24,
    },
});

export default NavButton;