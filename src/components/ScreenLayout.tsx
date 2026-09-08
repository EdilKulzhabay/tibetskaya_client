import React from 'react';
import {View, StyleSheet, Platform} from 'react-native';
import Navigation from './Navigation';

interface ScreenLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  showNavigation = true,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.topSpacer} />
      <View style={styles.content}>{children}</View>
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
  topSpacer: {
    backgroundColor: '#fff',
    height: Platform.OS === 'android' ? 10 : 35,
    width: '100%',
  },
});

export default ScreenLayout;
