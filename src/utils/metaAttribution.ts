import AsyncStorage from '@react-native-async-storage/async-storage';
import {AppLink} from 'react-native-fbsdk-next';

/**
 * Meta Conversions API ожидает `fbc` (клик по рекламе Facebook/Instagram) даже для
 * событий из мобильного приложения — см. crm/utils/metaConversionsApi.js. У нас нет
 * Universal Links/App Links, поэтому источник fbclid — deferred app link из FBSDK:
 * Facebook сам резолвит его по нашему App ID, если установка пришла с клика по рекламе.
 * SDK отдаёт непустой результат только на самом первом запуске после установки,
 * поэтому вызываем его один раз и сохраняем результат (в т.ч. отсутствие fbclid).
 */
const STORAGE_KEY = 'meta_fbclid_v1';

function extractFbclid(targetUrl: string | null): string | null {
  if (!targetUrl) return null;
  const match = targetUrl.match(/[?&]fbclid=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function captureDeferredFbclid(): Promise<void> {
  try {
    const alreadyChecked = await AsyncStorage.getItem(STORAGE_KEY);
    if (alreadyChecked !== null) return;
    const targetUrl = await AppLink.fetchDeferredAppLink();
    await AsyncStorage.setItem(STORAGE_KEY, extractFbclid(targetUrl) ?? '');
  } catch {
    // Атрибуция необязательна для работы приложения — тихо игнорируем сбой.
  }
}

export async function consumeStoredFbclid(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return value || null;
  } catch {
    return null;
  }
}
