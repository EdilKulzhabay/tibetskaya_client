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
import StableImage from './StableImage';

const { width: screenWidth } = Dimensions.get('window');

const MainPageBanner: React.FC<{ navigation: any, setIsModalVisible: (isModalVisible: boolean) => void }> = ({ navigation, setIsModalVisible }) => {

  const [currentIndex, setCurrentIndex] = useState(1); // Начинаем с индекса 1 для бесконечной прокрутки
  const flatListRef = useRef<FlatList>(null);

  const { user } = useAuth();

  const takePartHydrationLink = user?.isStartedHydration ? 'TakePartHydration' : 'StartHydration';

  const firstBanner = () => {
    return (
      <View style={styles.imageContainer}>
        <StableImage source={require('../assets/newBanner.png')} style={styles.image} />
      </View>
    )
  }

  const secondBanner = () => {
    return (
      <View style={styles.imageContainer}>
        <StableImage source={require('../assets/newBanner2.png')} style={styles.image} />
      </View>
    )
  }

  const thirdBanner = () => {
    return (
      <View style={styles.imageContainer}>
        <StableImage source={require('../assets/newBanner3.png')} style={styles.image} />
      </View>
    )
  }

  // Объявляем bannerComponents и extendedData после функций баннеров, но до useEffect
  const bannerComponents = [
    // { id: '1', Component: firstBanner },
    { id: '1', Component: secondBanner },
    { id: '2', Component: thirdBanner },
  ];
  
  const extendedData = [
    { ...bannerComponents[bannerComponents.length - 1], id: 'last-clone' },
    ...bannerComponents,
    { ...bannerComponents[0], id: 'first-clone' },
  ];

  useEffect(() => {
    // Автоматическая прокрутка каждые 15 секунды
    const interval = setInterval(() => {
      if (flatListRef.current) {
        // Вычисляем следующий индекс с учетом границ
        let nextIndex = currentIndex + 1;
        
        // Если дошли до клона первого элемента (последний индекс), переходим к первому реальному элементу
        if (nextIndex >= extendedData.length - 1) {
          nextIndex = 1;
        }
        
        try {
          flatListRef.current.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
        } catch (error) {
          // Если scrollToIndex не работает (элемент еще не отрендерен), используем scrollToOffset
          flatListRef.current.scrollToOffset({
            offset: nextIndex * screenWidth,
            animated: true,
          });
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [currentIndex, extendedData.length]);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    
    // Проверяем границы индекса
    if (index < 0 || index >= extendedData.length) {
      return;
    }
    
    // Обработка бесконечной прокрутки
    if (index === 0) {
      // Если дошли до клона последнего элемента, переходим к оригинальному последнему
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index: bannerComponents.length,
            animated: false,
          });
        } catch (error) {
          // Если scrollToIndex не работает, используем scrollToOffset
          flatListRef.current?.scrollToOffset({
            offset: bannerComponents.length * screenWidth,
            animated: false,
          });
        }
      }, 100);
      setCurrentIndex(bannerComponents.length);
    } else if (index === extendedData.length - 1) {
      // Если дошли до клона первого элемента, переходим к оригинальному первому
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index: 1,
            animated: false,
          });
        } catch (error) {
          // Если scrollToIndex не работает, используем scrollToOffset
          flatListRef.current?.scrollToOffset({
            offset: screenWidth,
            animated: false,
          });
        }
      }, 100);
      setCurrentIndex(1);
    } else {
      setCurrentIndex(index);
    }
  };

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

  const handleScrollToIndexFailed = (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
    // Если scrollToIndex не удался, используем scrollToOffset
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
      flatListRef.current?.scrollToOffset({
        offset: info.averageItemLength * info.index,
        animated: true,
      });
    });
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
        onScrollToIndexFailed={handleScrollToIndexFailed}
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
    minHeight: (screenWidth - 32) / 2.3,
    marginLeft: -16,
  },
  image: {
    width: '100%',
    height: (screenWidth - 32) / 2.3,
    resizeMode: 'contain',
  },
});

export default MainPageBanner;