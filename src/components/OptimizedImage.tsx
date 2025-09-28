import React, { useState } from 'react';
import { Image, ImageProps, View, ActivityIndicator } from 'react-native';

interface OptimizedImageProps extends ImageProps {
  fallbackSource?: any;
  showLoader?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  fallbackSource,
  showLoader = true,
  style,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const imageSource = hasError && fallbackSource ? fallbackSource : source;

  return (
    <View style={style}>
      <Image
        {...props}
        source={imageSource}
        style={style}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
      />
      {isLoading && showLoader && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          <ActivityIndicator size="small" color="#EE3F58" />
        </View>
      )}
    </View>
  );
};

export default OptimizedImage;
