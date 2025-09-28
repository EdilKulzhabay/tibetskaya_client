import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';

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
];

const ImagePreloader: React.FC<ImagePreloaderProps> = ({ children }) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    const preloadImages = async () => {
      const loadPromises = criticalImages.map((imageSource, index) => {
        return new Promise<void>((resolve) => {
          Image.prefetch(Image.resolveAssetSource(imageSource).uri)
            .then(() => {
              setLoadedCount(prev => prev + 1);
              resolve();
            })
            .catch(() => {
              // Если изображение не загрузилось, все равно считаем его загруженным
              setLoadedCount(prev => prev + 1);
              resolve();
            });
        });
      });

      await Promise.all(loadPromises);
      setImagesLoaded(true);
    };

    preloadImages();
  }, []);

  // Показываем детей только после загрузки всех изображений
  if (!imagesLoaded) {
    return null;
  }

  return <>{children}</>;
};

export default ImagePreloader;
