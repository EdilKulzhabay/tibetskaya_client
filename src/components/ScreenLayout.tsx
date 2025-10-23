import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Keyboard, Platform, Animated } from 'react-native';
import Navigation from './Navigation';

interface ScreenLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

const ScreenLayout: React.FC<ScreenLayoutProps> = ({ children, showNavigation = true }) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [showNav, setShowNav] = useState(showNavigation);

  useEffect(() => {
    // Если Navigation не должен показываться вообще, не подписываемся на события клавиатуры
    if (!showNavigation) {
      return;
    }

    // Для iOS используем Will события (срабатывают до анимации клавиатуры)
    // Для Android используем Did события (срабатывают после появления клавиатуры)
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    const keyboardDidShowListener = Keyboard.addListener(
      showEvent,
      (event) => {
        setKeyboardVisible(true);
        setShowNav(false);
        // Для Android используем немного более быструю анимацию
        const animationDuration = Platform.OS === 'ios' ? 250 : 200;

        
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: animationDuration,
          useNativeDriver: true,
        }).start();
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      hideEvent,
      (event) => {
        const animationDuration = Platform.OS === 'ios' ? 250 : 200;
        
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: animationDuration,
          useNativeDriver: true,
        }).start(() => {
          setKeyboardVisible(false);
          // Восстанавливаем Navigation только если он должен быть показан
          if (showNavigation) {
            setShowNav(true);
          }
        });
      }
    );

    // Очистка слушателей при размонтировании
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [slideAnim, showNavigation]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {children}
      </View>
      {/* Показываем Navigation только если showNavigation=true И showNav=true */}
      {showNavigation && showNav && (
        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
            opacity: slideAnim.interpolate({
              inputRange: [0, 100],
              outputRange: [1, 0],
            }),
          }}
        >
          <Navigation />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
});

export default ScreenLayout;

