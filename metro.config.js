const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
  },
  serializer: {
    // Улучшаем кэширование изображений
    getModulesRunBeforeMainModule: () => [],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
