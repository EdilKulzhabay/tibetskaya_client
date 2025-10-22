import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import StableImage from './StableImage';

const Back: React.FC<{ navigation: any, title: string }> = ({ navigation, title }) => {

  const onPress = () => {
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPress} style={styles.button}>
        <StableImage source={require('../assets/arrowBack.png')} style={styles.image} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  button: {
    padding: 8,
    backgroundColor: '#EFEFEF',
    borderRadius: 8,
  },
  image: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#292D32',
    marginLeft: 10,
  },
});

export default Back;

