import {createNavigationContainerRef} from '@react-navigation/native';
import type {RootStackParamList} from '../types/navigation';

/** Даёт доступ к навигации вне React-дерева (например, из push-notification сервиса). */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const READY_RETRY_DELAY_MS = 300;
const READY_MAX_ATTEMPTS = 15;

/**
 * Навигация вне React-дерева. При холодном старте (переход из уведомления, когда
 * приложение было закрыто) NavigationContainer ещё может быть не смонтирован —
 * в этом случае ждём готовности с ретраями вместо того, чтобы молча ничего не делать.
 */
export function navigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params: RootStackParamList[RouteName],
): void {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
    return;
  }

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (navigationRef.isReady()) {
      clearInterval(timer);
      navigationRef.navigate(name as never, params as never);
    } else if (attempts >= READY_MAX_ATTEMPTS) {
      clearInterval(timer);
      console.warn(
        '⚠️ [Navigation] NavigationContainer не готов, переход отменён:',
        name,
      );
    }
  }, READY_RETRY_DELAY_MS);
}
