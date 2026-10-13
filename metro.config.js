const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // mp4 — интро-видео при запуске (src/assets/video/intro.mp4)
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4'],
  },
  serializer: {
    // Улучшаем кэширование изображений
    getModulesRunBeforeMainModule: () => [],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
