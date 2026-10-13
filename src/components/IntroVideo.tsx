import React, {useCallback, useEffect, useRef} from 'react';
import {StatusBar, StyleSheet, View} from 'react-native';
import Video from 'react-native-video';

/** Видео ~2 с; если оно не стартовало или зависло — не держим пользователя на заставке. */
const INTRO_MAX_DURATION_MS = 4000;
/** Фон до первого кадра — совпадает с первым кадром видео, чтобы не было вспышки. */
const INTRO_BACKGROUND = '#FC311D';

interface IntroVideoProps {
  onFinish: () => void;
}

/**
 * Видео-заставка поверх приложения после нативного splash. Нативный LaunchScreen
 * (iOS) / windowBackground (Android) не умеют проигрывать видео, поэтому интро
 * показывается из JS, а приложение под ним в это время уже грузится.
 */
export default function IntroVideo({onFinish}: IntroVideoProps) {
  const isFinishedRef = useRef(false);

  const finish = useCallback(() => {
    if (isFinishedRef.current) {
      return;
    }
    isFinishedRef.current = true;
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    const timeoutId = setTimeout(finish, INTRO_MAX_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [finish]);

  return (
    <View style={styles.container} pointerEvents="none">
      <StatusBar hidden />
      <Video
        source={require('../assets/video/intro.mp4')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        muted
        repeat={false}
        paused={false}
        playInBackground={false}
        disableFocus
        onEnd={finish}
        onError={finish}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: INTRO_BACKGROUND,
  },
});
