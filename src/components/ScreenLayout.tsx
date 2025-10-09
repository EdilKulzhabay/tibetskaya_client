import React from 'react';
import { View, StyleSheet } from 'react-native';
import Navigation from './Navigation';

interface ScreenLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

const ScreenLayout: React.FC<ScreenLayoutProps> = ({ children, showNavigation = true }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {children}
      </View>
      {showNavigation && <Navigation />}
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

