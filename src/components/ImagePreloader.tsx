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
  require('../assets/bannerBottle.png'),
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
  require('../assets/newBanner.png'),
  require('../assets/newBanner2.png'),
  require('../assets/newBanner3.png'),
  require('../assets/marketPlace.png'),
];

const ImagePreloader: React.FC<ImagePreloaderProps> = ({ children }) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    const preloadImages = async () => {
      // На iOS для локальных изображений (require) prefetch менее критичен
      // Они уже встроены в bundle, поэтому загружаются быстро
      if (Platform.OS === 'ios') {
        // Для iOS даем небольшую задержку для инициализации Image cache
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Принудительно загружаем изображения через Image.getSize
        const loadPromises = criticalImages.map((imageSource) => {
          return new Promise<void>((resolve) => {
            try {
              const source = Image.resolveAssetSource(imageSource);
              if (source && source.uri) {
                // Используем Image.getSize для принудительной загрузки
                Image.getSize(
                  source.uri,
                  () => {
                    setLoadedCount(prev => prev + 1);
                    resolve();
                  },
                  () => {
                    // В случае ошибки все равно продолжаем
                    setLoadedCount(prev => prev + 1);
                    resolve();
                  }
                );
              } else {
                setLoadedCount(prev => prev + 1);
                resolve();
              }
            } catch (error) {
              setLoadedCount(prev => prev + 1);
              resolve();
            }
          });
        });

        await Promise.all(loadPromises);
      } else {
        // Для Android используем обычный prefetch
        const loadPromises = criticalImages.map((imageSource) => {
          return new Promise<void>((resolve) => {
            Image.prefetch(Image.resolveAssetSource(imageSource).uri)
              .then(() => {
                setLoadedCount(prev => prev + 1);
                resolve();
              })
              .catch(() => {
                setLoadedCount(prev => prev + 1);
                resolve();
              });
          });
        });

        await Promise.all(loadPromises);
      }

      setImagesLoaded(true);
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
});

export default ImagePreloader;
