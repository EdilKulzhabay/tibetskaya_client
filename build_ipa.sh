#!/bin/bash

# Скрипт для создания IPA файла через командную строку

echo "🚀 Создание IPA файла для TestFlight..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ]; then
    print_error "Запустите скрипт из корневой директории проекта"
    exit 1
fi

# 1. Очистка кэша
print_status "Очищаем кэш..."
rm -rf ios/build
rm -rf ~/Library/Developer/Xcode/DerivedData/tibetskayaClientApp-*
rm -rf build/ipa/*

# 2. Установка зависимостей
print_status "Устанавливаем зависимости..."
cd ios
pod install
if [ $? -ne 0 ]; then
    print_error "Ошибка при установке pod зависимостей"
    exit 1
fi
cd ..

# 3. Создание архива
print_status "Создаем архив..."
cd ios
xcodebuild -workspace tibetskayaClientApp.xcworkspace \
           -scheme tibetskayaClientApp \
           -configuration Release \
           -destination generic/platform=iOS \
           -archivePath ../build/tibetskayaClientApp.xcarchive \
           -allowProvisioningUpdates \
           archive

if [ $? -ne 0 ]; then
    print_error "Ошибка при создании архива"
    print_warning "Возможные решения:"
    print_warning "1. Откройте проект в Xcode и настройте подписание кода"
    print_warning "2. Убедитесь, что у вас есть действующий Apple Developer аккаунт"
    print_warning "3. Создайте App ID в Apple Developer Portal"
    exit 1
fi
cd ..

# 4. Экспорт IPA
print_status "Экспортируем IPA..."
xcodebuild -exportArchive \
           -archivePath build/tibetskayaClientApp.xcarchive \
           -exportPath build/ipa \
           -exportOptionsPlist build/ipa/ExportOptions.plist

if [ $? -ne 0 ]; then
    print_error "Ошибка при экспорте IPA"
    print_warning "Проверьте Team ID в ExportOptions.plist"
    exit 1
fi

# 5. Проверка результата
if [ -f "build/ipa/tibetskayaClientApp.ipa" ]; then
    print_status "IPA файл успешно создан: build/ipa/tibetskayaClientApp.ipa"
    print_warning "Не забудьте обновить Team ID в ExportOptions.plist перед загрузкой в TestFlight"
else
    print_error "IPA файл не был создан"
    exit 1
fi

echo "🎉 Готово! Теперь можно загружать в TestFlight"
