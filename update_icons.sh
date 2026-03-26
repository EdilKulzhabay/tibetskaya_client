#!/bin/bash
# Скрипт для обновления иконок из icon.png
# Запуск: ./update_icons.sh

set -e
ICON_SRC="icon.png"
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

if [ ! -f "$ICON_SRC" ]; then
  echo "Ошибка: icon.png не найден в корне проекта"
  exit 1
fi

echo "Обновление иконок из $ICON_SRC..."

# Android sizes: mdpi=48, hdpi=72, xhdpi=96, xxhdpi=144, xxxhdpi=192
ANDROID_RES="$PROJECT_ROOT/android/app/src/main/res"

for density in mdpi:48 hdpi:72 xhdpi:96 xxhdpi:144 xxxhdpi:192; do
  dir="${density%%:*}"
  size="${density##*:}"
  outdir="$ANDROID_RES/mipmap-$dir"
  mkdir -p "$outdir"
  sips -z $size $size "$ICON_SRC" --out "$outdir/ic_launcher.png"
  sips -z $size $size "$ICON_SRC" --out "$outdir/ic_launcher_round.png"
  sips -z $size $size "$ICON_SRC" --out "$outdir/ic_launcher_adaptive_fore.png"
  sips -z $size $size "$ICON_SRC" --out "$outdir/ic_launcher_adaptive_back.png"
  echo "  Android $dir: $size px"
done

# iOS sizes
IOS_ICONS="$PROJECT_ROOT/ios/tibetskayaClientApp/Images.xcassets/AppIcon.appiconset"
sips -z 40 40 "$ICON_SRC" --out "$IOS_ICONS/icon-20@2x.png"
sips -z 60 60 "$ICON_SRC" --out "$IOS_ICONS/icon-20@3x.png"
sips -z 58 58 "$ICON_SRC" --out "$IOS_ICONS/icon-29@2x.png"
sips -z 87 87 "$ICON_SRC" --out "$IOS_ICONS/icon-29@3x.png"
sips -z 80 80 "$ICON_SRC" --out "$IOS_ICONS/icon-40@2x.png"
sips -z 120 120 "$ICON_SRC" --out "$IOS_ICONS/icon-40@3x.png"
sips -z 120 120 "$ICON_SRC" --out "$IOS_ICONS/icon-60@2x.png"
sips -z 180 180 "$ICON_SRC" --out "$IOS_ICONS/icon-60@3x.png"
sips -z 1024 1024 "$ICON_SRC" --out "$IOS_ICONS/icon-1024.png"
echo "  iOS: все размеры"

# Play Store 512
mkdir -p "$PROJECT_ROOT/ic_launcher"
sips -z 512 512 "$ICON_SRC" --out "$PROJECT_ROOT/ic_launcher/play_store_512.png"
sips -z 1024 1024 "$ICON_SRC" --out "$PROJECT_ROOT/ic_launcher/1024.png"
echo "  Play Store: 512px, App Store: 1024px"

echo "Готово! Иконки обновлены."
