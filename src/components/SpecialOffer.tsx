import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

const SpecialOffer: React.FC<{ navigation: any }> = ({ navigation }) => {

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Особое предложение!</Text>
            <View style={styles.content}>
                <View style={styles.product}>
                    <View>
                        <Image source={require('../assets/bottleProduct.png')} style={styles.productImage} />
                    </View>
                    <View>
                        <Text style={styles.productTitle}>Вода 12,5 л</Text>
                        <Text style={styles.productSubtitle}>Негазированная</Text>
                        <Text style={styles.productPrice}>900 ₸</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('AddOrder', { products: { b12: 1, b19: 0 } })}>
                    <Text style={styles.buttonText}>Заказать</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F8DFDF',
        marginTop: 24,
        padding: 24
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        color: '#1F1923',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 16,
    },
    product: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    productImage: {
        width: 40,
        height: 60,
    },
    productTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#101010',
    },
    productSubtitle: {
        fontSize: 12,
        fontWeight: '500',
        color: '#101010',
    },
    productPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4D4353',
    },
    button: {
        backgroundColor: '#DC1818',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '500',
        color: 'white',
    },
});

export default SpecialOffer;