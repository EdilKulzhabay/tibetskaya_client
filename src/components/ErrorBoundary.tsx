import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Без этого приложение падало целиком на любой необработанной ошибке рендера
 * (например, нативный throw из react-native-fbsdk-next при логировании покупки) —
 * пользователь видел просто закрытие приложения. React не даёт функциональный
 * аналог для error boundary, поэтому это обязан быть классовый компонент.
 */
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return {hasError: true};
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Необработанная ошибка в приложении:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({hasError: false});
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Что-то пошло не так</Text>
          <Text style={styles.subtitle}>
            Попробуйте ещё раз. Если ошибка повторится, перезапустите
            приложение.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={this.handleRetry}
            accessibilityRole="button"
            accessibilityLabel="Попробовать снова">
            <Text style={styles.buttonText}>Попробовать снова</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101010',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#545454',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#DC1818',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
