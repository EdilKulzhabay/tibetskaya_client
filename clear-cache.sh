#!/bin/bash

echo "🧹 Очистка кэша React Native..."

# Очистка Metro кэша
echo "Очистка Metro кэша..."
npx react-native start --reset-cache

# Очистка npm кэша
echo "Очистка npm кэша..."
npm cache clean --force

# Очистка кэша iOS
echo "Очистка кэша iOS..."
cd ios && xcodebuild clean && cd ..

# Очистка кэша Android
echo "Очистка кэша Android..."
cd android && ./gradlew clean && cd ..

# Очистка node_modules
echo "Очистка node_modules..."
rm -rf node_modules
npm install

echo "✅ Кэш очищен! Теперь можно пересобрать приложение."
