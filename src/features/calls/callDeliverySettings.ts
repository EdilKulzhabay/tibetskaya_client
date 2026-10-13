/**
 * Android-настройки, без которых входящий не доходит, когда приложение не на экране:
 * - смахнутое из недавних приложение на Xiaomi/Huawei/Oppo… считается остановленным
 *   и не получает FCM без автозапуска и без снятия ограничений батареи;
 * - на заблокированном телефоне экран звонка (full-screen intent) открывается только
 *   с разрешением полноэкранных уведомлений (Android 14+), а на MIUI — ещё и с
 *   «Экраном блокировки» и «Всплывающими окнами в фоне».
 * Код не может включить их сам — просим пользователя, по одной настройке за раз.
 */
export interface DeliverySettingStep {
  id: string;
  message: string;
  /**
   * false — состояние настройки не узнать (экраны производителя): просим один раз,
   * иначе — пока настройка не включена.
   */
  isVerifiable: boolean;
  isNeeded(): Promise<boolean>;
  open(): Promise<unknown>;
}

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

interface Deps {
  steps: readonly DeliverySettingStep[];
  storage: KeyValueStorage;
  /** Объяснение и выбор пользователя: true — открыть настройки */
  ask(message: string): Promise<boolean>;
  now?: () => number;
  logger?: Pick<Console, 'warn'>;
}

/** «Позже» — не спрашивать сутки */
export const SNOOZE_MS = 24 * 60 * 60 * 1000;
export const STORAGE_KEYS = {
  snoozedUntil: 'calls.deliverySettings.snoozedUntil',
  askedSteps: 'calls.deliverySettings.askedSteps',
} as const;

const parseAskedSteps = (raw: string | null): string[] => {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
};

/**
 * ensure() показывает первую невыполненную настройку. Вызывать при каждом возврате
 * в приложение: вернулся из настроек — получил следующую.
 */
export const createCallDeliverySettings = ({
  steps,
  storage,
  ask,
  now = Date.now,
  logger = console,
}: Deps) => {
  let isRunning = false;

  const findNextStep = async (
    askedSteps: readonly string[],
  ): Promise<DeliverySettingStep | null> => {
    for (const step of steps) {
      if (!step.isVerifiable && askedSteps.includes(step.id)) {
        continue;
      }
      if (await step.isNeeded()) {
        return step;
      }
    }
    return null;
  };

  const run = async (): Promise<void> => {
    const snoozedUntil = Number(
      await storage.getItem(STORAGE_KEYS.snoozedUntil),
    );
    if (snoozedUntil > now()) {
      return;
    }
    const askedSteps = parseAskedSteps(
      await storage.getItem(STORAGE_KEYS.askedSteps),
    );
    const step = await findNextStep(askedSteps);
    if (!step) {
      return;
    }
    if (!(await ask(step.message))) {
      await storage.setItem(
        STORAGE_KEYS.snoozedUntil,
        String(now() + SNOOZE_MS),
      );
      return;
    }
    if (!step.isVerifiable) {
      await storage.setItem(
        STORAGE_KEYS.askedSteps,
        JSON.stringify([...askedSteps, step.id]),
      );
    }
    await step.open();
  };

  const ensure = async (): Promise<void> => {
    // Возврат в приложение во время открытого вопроса не должен показать второй
    if (isRunning) {
      return;
    }
    isRunning = true;
    try {
      await run();
    } catch (error) {
      logger.warn(
        '[calls] не удалось проверить настройки доставки звонков',
        error,
      );
    } finally {
      isRunning = false;
    }
  };

  return Object.freeze({ensure});
};
