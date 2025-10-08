# 📦 Создание APK файла через командную строку

## 🚀 Быстрая команда

### Debug APK (для тестирования)
```bash
cd android && ./gradlew assembleDebug && cd ..
```

### Release APK (для продакшна)
```bash
cd android && ./gradlew assembleRelease && cd ..
```

---

## 📍 Где найти готовый APK файл

После успешной сборки APK файл будет находиться:

**Debug версия:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

**Release версия:**
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 📝 Пошаговая инструкция

### 1️⃣ Очистить предыдущую сборку (рекомендуется)
```bash
cd android
./gradlew clean
cd ..
```

### 2️⃣ Собрать APK
```bash
# Для тестирования (debug)
cd android
./gradlew assembleDebug
cd ..

# ИЛИ для продакшна (release)
cd android
./gradlew assembleRelease
cd ..
```

### 3️⃣ Найти готовый файл
```bash
# Открыть папку с APK в Finder
open android/app/build/outputs/apk/debug/
# или
open android/app/build/outputs/apk/release/
```

---

## 🔐 Для Release версии с подписью

### Создание keystore файла (если еще не создан)
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 \
  -keystore my-release-key.keystore \
  -alias my-key-alias \
  -keyalg RSA -keysize 2048 -validity 10000
cd ../..
```

Вас попросят ввести:
- Пароль keystore
- Имя и другие данные
- Пароль для ключа

**⚠️ ВАЖНО:** Сохраните пароли! Без них вы не сможете обновить приложение в Google Play.

### Настройка подписи в gradle

Отредактируйте `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('my-release-key.keystore')
            storePassword 'ВАШ_ПАРОЛЬ_KEYSTORE'
            keyAlias 'my-key-alias'
            keyPassword 'ВАШ_ПАРОЛЬ_КЛЮЧА'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}
```

**🔒 Безопасность:** Не коммитьте пароли в Git! Используйте переменные окружения:

```gradle
signingConfigs {
    release {
        storeFile file('my-release-key.keystore')
        storePassword System.getenv("KEYSTORE_PASSWORD")
        keyAlias System.getenv("KEY_ALIAS")
        keyPassword System.getenv("KEY_PASSWORD")
    }
}
```

Затем перед сборкой:
```bash
export KEYSTORE_PASSWORD="ваш_пароль"
export KEY_ALIAS="my-key-alias"
export KEY_PASSWORD="ваш_пароль_ключа"
```

---

## 🎯 Полная команда сборки (с очисткой)

```bash
# Debug версия
cd android && ./gradlew clean assembleDebug && cd ..

# Release версия
cd android && ./gradlew clean assembleRelease && cd ..
```

---

## 📊 Проверка размера APK

```bash
# Debug
ls -lh android/app/build/outputs/apk/debug/app-debug.apk

# Release
ls -lh android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔍 Установка APK на устройство

### Через ADB (если устройство подключено по USB)
```bash
# Debug версия
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Release версия
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Через файловый менеджер
1. Скопируйте APK на устройство (через USB, email, облако)
2. Откройте файл на устройстве
3. Разрешите установку из неизвестных источников
4. Установите приложение

---

## ⚡ Оптимизация Release сборки

Для уменьшения размера APK включите ProGuard в `android/app/build.gradle`:

```gradle
def enableProguardInReleaseBuilds = true
```

И включите разделение по архитектуре:

```gradle
android {
    splits {
        abi {
            reset()
            enable true
            universalApk false
            include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
        }
    }
}
```

Это создаст отдельные APK для каждой архитектуры:
- `app-armeabi-v7a-release.apk` (для старых устройств)
- `app-arm64-v8a-release.apk` (для большинства современных устройств)
- `app-x86-release.apk` (для эмуляторов)
- `app-x86_64-release.apk` (для эмуляторов)

---

## 🐛 Устранение проблем

### Ошибка: "SDK location not found"
```bash
# Создайте файл local.properties
echo "sdk.dir=/Users/$(whoami)/Library/Android/sdk" > android/local.properties
```

### Ошибка: "Permission denied"
```bash
# Дайте права на выполнение gradlew
chmod +x android/gradlew
```

### Ошибка памяти при сборке
```bash
# Увеличьте память для Gradle
export GRADLE_OPTS="-Xmx4096m -XX:MaxPermSize=512m"
```

### Очистить все кеши
```bash
# Удалить node_modules и пересобрать
rm -rf node_modules
npm install

# Очистить кеш Metro
npx react-native start --reset-cache

# Очистить кеш Gradle
cd android
./gradlew clean
./gradlew cleanBuildCache
cd ..
```

---

## 📱 Создание AAB (Android App Bundle) для Google Play

Google Play теперь требует AAB вместо APK:

```bash
cd android
./gradlew bundleRelease
cd ..
```

Файл будет в:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🎬 Полный процесс сборки для публикации

```bash
# 1. Обновить версию в android/app/build.gradle
# versionCode 2
# versionName "1.1"

# 2. Очистить кеш
rm -rf node_modules
npm install
cd android && ./gradlew clean && cd ..

# 3. Собрать release APK
cd android && ./gradlew assembleRelease && cd ..

# 4. ИЛИ собрать AAB для Google Play
cd android && ./gradlew bundleRelease && cd ..

# 5. Проверить файл
ls -lh android/app/build/outputs/apk/release/
# или
ls -lh android/app/build/outputs/bundle/release/
```

---

## 📋 Чеклист перед публикацией

- [ ] Обновлен `versionCode` и `versionName`
- [ ] Проверены все разрешения в `AndroidManifest.xml`
- [ ] Настроена подпись release keystore
- [ ] Включен ProGuard (опционально)
- [ ] Проверен размер APK/AAB
- [ ] Протестировано на реальном устройстве
- [ ] Проверены иконки и splash screen
- [ ] Обновлено описание в Google Play Console

---

## 📚 Полезные команды

```bash
# Посмотреть все доступные задачи Gradle
cd android && ./gradlew tasks && cd ..

# Собрать debug + запустить на устройстве
npx react-native run-android

# Собрать только APK без установки
cd android && ./gradlew assembleDebug && cd ..

# Собрать и установить
cd android && ./gradlew installDebug && cd ..

# Удалить приложение с устройства
adb uninstall com.tibetskayaclientapp
```

---

**🎯 Рекомендация:** Для тестирования используйте debug APK, для публикации - release AAB.

