# Навигация

Эта папка предназначена для файлов навигации.

## Рекомендуемые библиотеки навигации:

### 1. React Navigation (Самая популярная)
```bash
npm install @react-navigation/native
npm install react-native-screens react-native-safe-area-context

# Для Stack Navigator
npm install @react-navigation/native-stack

# Для Tab Navigator  
npm install @react-navigation/bottom-tabs

# Для Drawer Navigator
npm install @react-navigation/drawer
```

### 2. React Native Navigation (от Wix)
```bash
npm install react-native-navigation
```

## Пример структуры с React Navigation:

```typescript
// navigation/AppNavigator.tsx
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {HomeScreen, ProfileScreen} from '../screens';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

Затем замените содержимое App.tsx на:
```typescript
import {AppNavigator} from './src/navigation/AppNavigator';

export default function App() {
  return <AppNavigator />;
}
```
