import React, { useState } from 'react';
import { Image, ImageProps, View, StyleSheet, ActivityIndicator } from 'react-native';

interface StableImageProps extends ImageProps {
  source: any;
  style?: any;
  showLoader?: boolean;
}

/**
 * Компонент StableImage решает проблемы с позиционированием изображений на iOS
 * Обеспечивает правильную загрузку и отображение изображений
 */
const StableImage: React.FC<StableImageProps> = ({ 
  source, 
  style, 
  showLoader = false,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Для локальных изображений (require) сразу считаем загруженными
  const isLocalImage = typeof source === 'number' || (source && typeof source === 'object' && !source.uri);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <View style={[style, styles.container]}>
      {showLoader && !isLoaded && !isLocalImage && (
        <View style={[StyleSheet.absoluteFill, styles.loaderContainer]}>
          <ActivityIndicator size="small" color="#DC1818" />
        </View>
      )}
      <Image
        {...props}
        source={source}
        style={[
          style,
          // Гарантируем, что изображение займет правильную позицию
          { width: style?.width, height: style?.height }
        ]}
        onLoad={handleLoad}
        onError={handleError}
        // Для iOS важно указать resizeMode явно
        resizeMode={props.resizeMode || 'contain'}
        // Ключ по source для правильного кэширования
        key={typeof source === 'number' ? source : source?.uri}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});

export default StableImage;
