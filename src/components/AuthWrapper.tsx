import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';

interface AuthWrapperProps {
  children: React.ReactNode;
}

/**
 * Компонент-обертка для проверки авторизации
 * Показывает загрузку пока проверяется состояние авторизации
 */
const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { loadingState } = useAuth();

  // Показываем загрузку пока проверяется авторизация
  if (loadingState === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#DC1818" />
      </View>
    );
  }

  return <>{children}</>;
};

export default AuthWrapper;
