import React, { useEffect, useState } from 'react';
import { Image, View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';

interface ImagePreloaderProps {
  children: React.ReactNode;
}

// Список всех критических изображений для предзагрузки
const criticalImages = [
  require('../assets/mainIcon.png'),
  require('../assets/homeIcon.png'),
  require('../assets/homeActiveIcon.png'),
  require('../assets/profileIcon.png'),
  require('../assets/profileActiveIcon.png'),
  require('../assets/historyIcon.png'),
  require('../assets/historyActiveIcon.png'),
  require('../assets/supportIcon.png'),
  require('../assets/supportActiveIcon.png'),
  require('../assets/bonusIcon.png'),
  require('../assets/arrowBack.png'),
  // require('../assets/bannerBottle.png'),
  require('../assets/bannerBottle2.png'),
  require('../assets/marketplace1.png'),
  require('../assets/marketplace2.png'),
  require('../assets/bottleProduct.png'),
  require('../assets/bottleProduct12.png'),
  require('../assets/whatIsMyBalance.png'),
  require('../assets/howToTopUp.png'),
  require('../assets/banner3.png'),
  require('../assets/banner4.png'),
  require('../assets/banner5.png'),
  require('../assets/banner4_2.png'),
  require('../assets/notificationIcon.png'),
  require('../assets/newBanner1.png'),
  require('../assets/newBanner2.png'),
  require('../assets/newBanner3.png'),
  require('../assets/newBanner4.png'),
  require('../assets/marketPlace.png'),
];

const ImagePreloader: React.FC<ImagePreloaderProps> = ({ children }) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [useHiddenImages] = useState(Platform.OS === 'ios');

  useEffect(() => {
    const preloadImages = async () => {
      try {
        // Для iOS используем prefetch + дополнительную задержку для стабилизации
        if (Platform.OS === 'ios') {
          console.log('🖼️ [ImagePreloader] iOS: Начало предзагрузки изображений...');
          
          // Даем время на инициализацию
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Используем prefetch для реальной загрузки в кеш
          const loadPromises = criticalImages.map((imageSource, index) => {
            return new Promise<void>((resolve) => {
              try {
                const source = Image.resolveAssetSource(imageSource);
                if (source && source.uri) {
                  // Используем prefetch для загрузки в кеш
                  Image.prefetch(source.uri)
                    .then(() => {
                      setLoadedCount(prev => prev + 1);
                      console.log(`✅ [ImagePreloader] Загружено ${index + 1}/${criticalImages.length}`);
                      resolve();
                    })
                    .catch((error) => {
                      console.warn(`⚠️ [ImagePreloader] Ошибка загрузки изображения ${index + 1}:`, error);
                      setLoadedCount(prev => prev + 1);
                      resolve();
                    });
                } else {
                  setLoadedCount(prev => prev + 1);
                  resolve();
                }
              } catch (error) {
                console.warn(`⚠️ [ImagePreloader] Ошибка resolveAssetSource ${index + 1}:`, error);
                setLoadedCount(prev => prev + 1);
                resolve();
              }
            });
          });

          await Promise.all(loadPromises);
          
          // Дополнительная задержка для стабилизации кеша на iOS
          await new Promise(resolve => setTimeout(resolve, 200));
          
          console.log('✅ [ImagePreloader] iOS: Все изображения загружены');
        } else {
          // Для Android используем обычный prefetch
          console.log('🖼️ [ImagePreloader] Android: Начало предзагрузки изображений...');
          
          const loadPromises = criticalImages.map((imageSource, index) => {
            return new Promise<void>((resolve) => {
              try {
                const source = Image.resolveAssetSource(imageSource);
                Image.prefetch(source.uri)
                  .then(() => {
                    setLoadedCount(prev => prev + 1);
                    resolve();
                  })
                  .catch(() => {
                    setLoadedCount(prev => prev + 1);
                    resolve();
                  });
              } catch (error) {
                setLoadedCount(prev => prev + 1);
                resolve();
              }
            });
          });

          await Promise.all(loadPromises);
          
          console.log('✅ [ImagePreloader] Android: Все изображения загружены');
        }

        setImagesLoaded(true);
      } catch (error) {
        console.error('❌ [ImagePreloader] Критическая ошибка при предзагрузке:', error);
        // В случае критической ошибки все равно показываем приложение
        setImagesLoaded(true);
      }
    };

    preloadImages();
  }, []);

  // Показываем индикатор загрузки
  if (!imagesLoaded) {
    const progress = Math.round((loadedCount / criticalImages.length) * 100);
    
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#DC1818" />
        <Text style={styles.loaderText}>Загрузка изображений...</Text>
        <Text style={styles.progressText}>{progress}%</Text>
        
        {/* Для iOS: скрытые Image компоненты для гарантированной загрузки в память */}
        {useHiddenImages && (
          <View style={styles.hiddenImagesContainer}>
            {criticalImages.map((imageSource, index) => (
              <Image
                key={`hidden-image-${index}`}
                source={imageSource}
                style={styles.hiddenImage}
                onLoad={() => {
                  // Дополнительная проверка загрузки
                }}
                onError={(error) => {
                  console.warn(`⚠️ [ImagePreloader] Ошибка загрузки скрытого изображения ${index}:`, error.nativeEvent.error);
                }}
              />
            ))}
          </View>
        )}
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    color: '#545454',
    fontWeight: '500',
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    color: '#99A3B3',
    fontWeight: '600',
  },
  hiddenImagesContainer: {
    position: 'absolute',
    top: -10000,
    left: -10000,
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  hiddenImage: {
    width: 1,
    height: 1,
    opacity: 0,
  },
});

export default ImagePreloader;
