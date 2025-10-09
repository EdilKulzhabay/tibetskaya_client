#!/bin/bash

echo "🧹 Очистка старых сборок..."
cd android
./gradlew clean

echo ""
echo "🔨 Сборка Release APK..."
./gradlew assembleRelease

echo ""
echo "✅ APK собран!"
echo "📦 Путь к APK: android/app/build/outputs/apk/release/app-release.apk"
echo ""
echo "📱 Для установки на устройство выполните:"
echo "   adb install -r android/app/build/outputs/apk/release/app-release.apk"

