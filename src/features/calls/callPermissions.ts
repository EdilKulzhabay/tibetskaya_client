import {PermissionsAndroid, Platform} from 'react-native';

/** С Android 12 (API 31) BLUETOOTH_CONNECT — runtime-разрешение */
const ANDROID_BLUETOOTH_CONNECT_MIN_API = 31;

/**
 * Без BLUETOOTH_CONNECT InCallManager молча не маршрутизирует звук в Bluetooth-гарнитуру.
 * Отказ не блокирует звонок — звук пойдёт в динамик телефона.
 * RECORD_AUDIO отдельно не запрашиваем: это делает getUserMedia в react-native-webrtc.
 */
export const requestBluetoothPermission = async (): Promise<void> => {
  if (
    Platform.OS !== 'android' ||
    Number(Platform.Version) < ANDROID_BLUETOOTH_CONNECT_MIN_API
  ) {
    return;
  }
  try {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    );
  } catch (error) {
    console.warn('[calls] не удалось запросить BLUETOOTH_CONNECT', error);
  }
};
