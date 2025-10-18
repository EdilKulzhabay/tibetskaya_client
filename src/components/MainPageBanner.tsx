import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
  ImageBackground,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../hooks';

const { width: screenWidth } = Dimensions.get('window');

const MainPageBanner: React.FC<{ navigation: any, setIsModalVisible: (isModalVisible: boolean) => void }> = ({ navigation, setIsModalVisible }) => {

  const [currentIndex, setCurrentIndex] = useState(1); // Начинаем с индекса 1 для бесконечной прокрутки
  const flatListRef = useRef<FlatList>(null);

  const { user } = useAuth();

  const takePartHydrationLink = user?.isStartedHydration ? 'TakePartHydration' : 'StartHydration';

  const firstBanner = () => {
    return (
      <View style={styles.imageContainer}>
        <Image source={require('../assets/newBanner.png')} style={styles.image} />
      </View>
      // <View style={{
      //   backgroundColor: '#DC3F34',
      //   borderRadius: 8,
      //   height: 180,
      //   overflow: 'hidden',
      //   flexDirection: 'row',
      //   justifyContent: 'space-between',
      //   alignItems: 'center',
      //   padding: 12,
      //   paddingLeft: 16,
      //   paddingRight: 45,
      // }}>
      //   <View style={{ flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      //     <Image source={require('../assets/banner4_2.png')} style={{ width: 200, height: 70, resizeMode: 'contain' }} />
      //     <Text style={{ fontSize: 16, fontWeight: '500', color: '#fff' }}>“Чистая, полезная вода{"\n"}— прямо к вашей двери”</Text>
      //   </View>
      //   <View>
      //     <Image source={require('../assets/banner4.png')} style={{ width: 106, height: 117, resizeMode: 'contain' }} />
      //   </View>
      // </View>



      // <LinearGradient
      //   colors={['#CB5D5D', '#C0DDFE']}
      //   start={{ x: 0, y: 0 }}            
      //   end={{ x: 0, y: 1 }}             
      //   style={firstBannerStyles.container}
      // >
      //   <Image source={require('../assets/bannerBottle.png')} style={firstBannerStyles.image} />
      //   <View style={firstBannerStyles.content}>
      //     <Text style={firstBannerStyles.title}>Скидки для{"\n"}партнеров</Text>
      //     <TouchableOpacity style={firstBannerStyles.button} onPress={() => navigation.navigate('TakePartInvite')}>
      //       <Text style={firstBannerStyles.buttonText}>Подробнее</Text>
      //     </TouchableOpacity>
      //   </View>
      // </LinearGradient>
    )
  }

  const secondBanner = () => {
    return (
      <View style={styles.imageContainer}>
        <Image source={require('../assets/newBanner2.png')} style={styles.image} />
      </View>
      // <View style={{
      //   backgroundColor: '#1FABEE',
      //   borderRadius: 8,
      //   height: 180,
      //   overflow: 'hidden',
      //   flexDirection: 'row',
      //   justifyContent: 'space-between',
      //   alignItems: 'center',
      //   padding: 12,
      //   paddingLeft: 16,
      //   paddingRight: 16,
      //   position: 'relative',
      // }}>
      //   <View 
      //     style={{
      //       position: 'absolute',
      //       width: 270,
      //       height: 270,
      //       backgroundColor: '#fff',
      //       borderRadius: 135,
      //       top: 90,
      //       right: 0,
      //       transform: [{ translateX: "38%" }, { translateY: "-50%" }],
      //     }}
      //   />
      //   <View>
      //     <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff' }}>Новый удобный формат{"\n"}— 12,5 литров!</Text>
      //     <Text style={{ marginTop: 4, fontSize: 14, fontWeight: '500', color: '#fff' }}>Попробуйте уже сегодня</Text>
      //     <TouchableOpacity style={{ marginTop: 24, backgroundColor: '#DC1818', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8, alignSelf: 'flex-start' }} onPress={() => {}}>
      //       <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Купить сейчас</Text>
      //     </TouchableOpacity>
      //   </View>

      //   <Image source={require('../assets/banner5.png')} style={{ width: 190, height: 190, resizeMode: 'contain', marginLeft: -10 }} />
      // </View>

      // <View style={secondBannerStyles.container}>
      //   <View style={secondBannerStyles.content}> 
      //     <Text style={secondBannerStyles.title}>Выпей 3{"\n"}бутылки воды</Text>
      //     <TouchableOpacity style={secondBannerStyles.button} onPress={() => navigation.navigate(takePartHydrationLink)}>
      //       <Text style={secondBannerStyles.buttonText}>Подробнее</Text>
      //     </TouchableOpacity>
      //   </View>
      //   <View style={secondBannerStyles.imageContainer}>
      //     <Image source={require('../assets/bannerBottle2.png')} style={secondBannerStyles.image} />
      //   </View>
      // </View>
    )
  }

  const thirdBanner = () => {
    return (
      <View style={styles.imageContainer}>
        <Image source={require('../assets/newBanner3.png')} style={styles.image} />
      </View>
      // <View
      //   style={{
      //     backgroundColor: '#1488E8',
      //     borderRadius: 8,
      //     height: 180,
      //     overflow: 'hidden',
      //     padding: 24,
      //     position: 'relative',
      //   }}
      // >
      //   <View>
      //     <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff' }}>Скоро вместе с Alma TV!</Text>
      //     <Text style={{ marginTop: 4, fontSize: 14, fontWeight: '500', color: '#fff' }}>
      //       Эксклюзивные бонусы и скидки{"\n"}для абонентов Alma TV на воду{"\n"}Тибетская.
      //     </Text>
      //     <TouchableOpacity style={{ marginTop: 24, backgroundColor: '#DC1818', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8, alignSelf: 'flex-start' }} onPress={() => setIsModalVisible(true)}>
      //       <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Отслеживать</Text>
      //     </TouchableOpacity>
      //   </View>

      //   <View style={{ 
      //     position: 'absolute', 
      //     right: 45, 
      //     top: 24,
      //     width: 60,
      //     height: 60,
      //     backgroundColor: '#DC1818',
      //     borderRadius: 30,
      //     alignItems: 'center',
      //     justifyContent: 'center',
      //   }}>
      //     <Image source={require('../assets/banner4.png')} style={{ width: 30, height: 30, resizeMode: 'contain' }} />
      //   </View>
      //   <View style={{ 
      //     position: 'absolute', 
      //     right: 45, 
      //     bottom: 0,
      //     transform: [{ translateY: "30%" }],
      //     width: 106,
      //     height: 106,
      //     borderRadius: 53,
      //     backgroundColor: '#fff',
      //     alignItems: 'center',
      //     justifyContent: 'center',
      //   }}>
      //     <Image source={require('../assets/banner6.png')} style={{ width: 80, height: 30, resizeMode: 'contain', marginTop: -10, marginLeft: 5 }} />
      //   </View>
      //   <View style={{ 
      //     position: 'absolute', 
      //     right: 110, 
      //     top: 70,
      //     width: 6,
      //     height: 6,
      //     borderRadius: 3,
      //     backgroundColor: '#fff',
      //   }}/>
      //   <View style={{ 
      //     position: 'absolute', 
      //     right: 115, 
      //     top: 90,
      //     width: 8,
      //     height: 8,
      //     borderRadius: 4,
      //     backgroundColor: '#DC1818',
      //   }}/>
      //   <View style={{ 
      //     position: 'absolute', 
      //     right: 45, 
      //     top: 110,
      //     width: 6,
      //     height: 6,
      //     borderRadius: 3,
      //     backgroundColor: '#fff',
      //   }}/>
      // </View>


      // <ImageBackground 
      //   source={require('../assets/banner3.png')} 
      //   style={thirdBannerStyles.container}
      //   imageStyle={thirdBannerStyles.bgImage}
      // >
      //   <Text style={thirdBannerStyles.title}>Вызови мастера на дом</Text>
      //   <Text style={thirdBannerStyles.subtitle}>Наша новая услуга по{"\n"}устранению ваших проблем</Text>
      //   <TouchableOpacity style={thirdBannerStyles.button} onPress={() => setIsModalVisible(true)}>
      //     <Text style={thirdBannerStyles.buttonText}>Вызвать</Text>
      //   </TouchableOpacity>
      // </ImageBackground>
    )
  }

  useEffect(() => {
    // Автоматическая прокрутка каждые 15 секунды
    const interval = setInterval(() => {
      if (flatListRef.current) {
        const nextIndex = currentIndex + 1;
        flatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    
    // Обработка бесконечной прокрутки
    if (index === 0) {
      // Если дошли до клона последнего элемента, переходим к оригинальному последнему
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: bannerComponents.length,
          animated: false,
        });
      }, 100);
      setCurrentIndex(bannerComponents.length);
    } else if (index === extendedData.length - 1) {
      // Если дошли до клона первого элемента, переходим к оригинальному первому
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: 1,
          animated: false,
        });
      }, 100);
      setCurrentIndex(1);
    } else {
      setCurrentIndex(index);
    }
  };

  const bannerComponents = [
    { id: '1', Component: firstBanner },
    { id: '2', Component: secondBanner },
    { id: '3', Component: thirdBanner },
  ];
  
  const extendedData = [
    { ...bannerComponents[bannerComponents.length - 1], id: 'last-clone' },
    ...bannerComponents,
    { ...bannerComponents[0], id: 'first-clone' },
  ];

  const renderBanner = ({ item }: { item: { id: string; Component: React.FC } }) => {
    const Banner = item.Component;
    return (
      <View style={{ width: screenWidth }}>
        <Banner />
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {bannerComponents.map((_, index) => {
          const actualIndex = currentIndex === 0 ? bannerComponents.length - 1 :
                             currentIndex === extendedData.length - 1 ? 0 :
                             currentIndex - 1;
          
          return (
            <View
              key={index}
              style={[
                styles.paginationDot,
                actualIndex === index && styles.paginationDotActive,
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={extendedData}
        renderItem={renderBanner}
        snapToInterval={screenWidth}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        initialScrollIndex={1} // Начинаем с первого реального элемента
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
      />
      {renderPagination()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    overflow: 'hidden',
    borderRadius: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C4C4C4',
  },
  paginationDotActive: {
    backgroundColor: '#DC1818',
    width: 24,
  },
  imageContainer: {
    width: screenWidth,
    height: 160,
    marginLeft: -16,
  },
  image: {
    width: '100%',
    height: 160,
    resizeMode: 'contain',
  },
});

const firstBannerStyles = StyleSheet.create({
  container: {
    borderRadius: 8,
    position: 'relative',
    width: "100%",
    height: 180,
    overflow: 'hidden',
  },
  content: {
    paddingVertical: 33,
    paddingLeft: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  button: {
    marginTop: 12,
    backgroundColor: '#DC1818',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  image: {
    width: "90%",
    height: "90%",
    resizeMode: 'contain',
    position: 'absolute',
    top: 0,
    right: 0,
    transform: [{ translateX: "10%" }],
  },
});

const secondBannerStyles = StyleSheet.create({
  container: {
    borderRadius: 8,
    backgroundColor: '#D2E9FF',
    paddingVertical: 9,
    paddingLeft: 24,
    paddingRight: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: "100%",
    height: 180,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 30,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  button: {
    marginTop: 12,
    backgroundColor: '#DC1818',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  imageContainer: {
    width: "50%",
    alignSelf: 'flex-start',
  },
  image: {
    resizeMode: 'contain',
    width: "100%",
    height: 150,
    transform: [{ translateX: "-15%" }],
  },
});

const thirdBannerStyles = StyleSheet.create({
  container: {
    borderRadius: 8,
    paddingVertical: 33,
    paddingLeft: 24,
    width: "100%",
    height: 180,
    overflow: 'hidden',
  },
  bgImage: {
    borderRadius: 8,
    resizeMode: 'stretch',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
  },
  button: {
    marginTop: 12,
    backgroundColor: '#DC1818',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});

export default MainPageBanner;