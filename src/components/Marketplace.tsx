import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import StableImage from './StableImage';

const Marketplace = () => {
    return (
        <View>
            <View style={styles.containerTitle}>
                <Text style={styles.title}>Маркетплейс</Text>
                <TouchableOpacity>
                    <Text style={styles.button}>смотреть все</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.marketplaceContainer}>
                <View style={styles.marketplace}>
                    <StableImage source={require('../assets/marketplace1.png')} style={styles.marketplaceImage} />
                    <Text numberOfLines={1} ellipsizeMode="tail" style={styles.marketplaceTitle}>Помпа электрическая</Text>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={styles.marketplaceSubtitle}>Тибетская</Text>
                    <Text style={styles.marketplacePrice}>7 000 ₸</Text>
                </View>
                <View style={styles.marketplace}>
                    <StableImage source={require('../assets/marketplace2.png')} style={styles.marketplaceImage} />
                    <Text numberOfLines={1} ellipsizeMode="tail" style={styles.marketplaceTitle}>Помпа механическая</Text>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={styles.marketplaceSubtitle}>Тибетская</Text>
                    <Text style={styles.marketplacePrice}>6 000 ₸</Text>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    containerTitle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#101010',
    },
    button: {
        fontSize: 14,
        fontWeight: '700',
        color: '#DC1818',
    },
    marketplaceContainer: {
        marginTop: 8,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    marketplace: {
        flexBasis: '45%',
        marginTop: 16,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        paddingTop: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    marketplaceImage: {
        width: '100%',
        height: 123,
    },
    marketplaceTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#101010',
    },
    marketplaceSubtitle: {
        fontSize: 14,
        marginTop: 4,
        fontWeight: '500',
        color: '#101010',
    },
    marketplacePrice: {
        fontSize: 16,
        marginTop: 12,
        fontWeight: '600',
        color: '#DC1818',
    },
});

export default Marketplace;