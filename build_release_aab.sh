#!/bin/bash

# Скрипт для создания release AAB (Android App Bundle) для Google Play
# Версия: 1.0.0

echo "🚀 Начинаю сборку release AAB файла..."
echo "📦 Версия приложения: 1.0.0"

# Переходим в директорию android
cd android

# Очищаем предыдущие сборки
echo "🧹 Очистка предыдущих сборок..."
./gradlew clean

# Собираем release AAB
echo "🔨 Сборка release AAB..."
./gradlew bundleRelease

# Проверяем результат
if [ $? -eq 0 ]; then
    echo "✅ AAB файл успешно создан!"
    echo ""
    echo "📍 Путь к файлу:"
    echo "   $(pwd)/app/build/outputs/bundle/release/app-release.aab"
    echo ""
    echo "📊 Информация о файле:"
    ls -lh app/build/outputs/bundle/release/app-release.aab
    echo ""
    echo "🎉 Готово! Файл можно загрузить в Google Play Console."
    echo ""
    echo "💡 Следующие шаги:"
    echo "   1. Перейдите в Google Play Console"
    echo "   2. Выберите ваше приложение"
    echo "   3. Перейдите в раздел 'Релизы' -> 'Производство'"
    echo "   4. Создайте новый релиз и загрузите файл app-release.aab"
else
    echo "❌ Ошибка при сборке AAB файла"
    exit 1
fi

cd ..

