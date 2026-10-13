import {
  createCallDeliverySettings,
  DeliverySettingStep,
  SNOOZE_MS,
  STORAGE_KEYS,
} from '../callDeliverySettings';

const NOW = 1_000_000;

const flush = () => new Promise(resolve => setImmediate(resolve));

const createStorage = (initial: Record<string, string> = {}) => {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
  };
};

const createStep = (
  id: string,
  {isNeeded = true, isVerifiable = true} = {},
): DeliverySettingStep & {open: jest.Mock} => ({
  id,
  message: `message ${id}`,
  isVerifiable,
  isNeeded: jest.fn(async () => isNeeded),
  open: jest.fn(async () => {}),
});

const setUp = ({
  steps,
  storage = createStorage(),
  answer = true,
}: {
  steps: DeliverySettingStep[];
  storage?: ReturnType<typeof createStorage>;
  answer?: boolean;
}) => {
  const ask = jest.fn(async () => answer);
  const settings = createCallDeliverySettings({
    steps,
    storage,
    ask,
    now: () => NOW,
    logger: {warn: jest.fn()},
  });
  return {settings, ask, storage};
};

describe('createCallDeliverySettings', () => {
  test('asks only the first needed step and opens its settings', async () => {
    const done = createStep('done', {isNeeded: false});
    const first = createStep('first');
    const second = createStep('second');
    const {settings, ask} = setUp({steps: [done, first, second]});

    await settings.ensure();

    expect(ask).toHaveBeenCalledTimes(1);
    expect(ask).toHaveBeenCalledWith('message first');
    expect(first.open).toHaveBeenCalled();
    expect(second.open).not.toHaveBeenCalled();
  });

  test('asks an unverifiable step only once', async () => {
    const autostart = createStep('autostart', {isVerifiable: false});
    const {settings, ask} = setUp({steps: [autostart]});

    await settings.ensure();
    await settings.ensure();

    expect(ask).toHaveBeenCalledTimes(1);
  });

  test('keeps asking a verifiable step while it is still needed', async () => {
    const battery = createStep('battery');
    const {settings, ask} = setUp({steps: [battery]});

    await settings.ensure();
    await settings.ensure();

    expect(ask).toHaveBeenCalledTimes(2);
  });

  test('"later" snoozes all steps for a day', async () => {
    const step = createStep('step', {isVerifiable: false});
    const {settings, ask, storage} = setUp({steps: [step], answer: false});

    await settings.ensure();
    await settings.ensure();

    expect(ask).toHaveBeenCalledTimes(1);
    expect(step.open).not.toHaveBeenCalled();
    expect(storage.values.get(STORAGE_KEYS.snoozedUntil)).toBe(
      String(NOW + SNOOZE_MS),
    );
    expect(storage.values.has(STORAGE_KEYS.askedSteps)).toBe(false);
  });

  test('asks again after the snooze expires', async () => {
    const storage = createStorage({
      [STORAGE_KEYS.snoozedUntil]: String(NOW - 1),
    });
    const {settings, ask} = setUp({steps: [createStep('step')], storage});

    await settings.ensure();

    expect(ask).toHaveBeenCalledTimes(1);
  });

  test('ignores corrupted asked-steps storage', async () => {
    const storage = createStorage({[STORAGE_KEYS.askedSteps]: '{broken'});
    const step = createStep('autostart', {isVerifiable: false});
    const {settings, ask} = setUp({steps: [step], storage});

    await settings.ensure();

    expect(ask).toHaveBeenCalledTimes(1);
    expect(storage.values.get(STORAGE_KEYS.askedSteps)).toBe('["autostart"]');
  });

  test('does not show a second question while one is open', async () => {
    let answer: (value: boolean) => void = () => {};
    const ask = jest.fn(
      () =>
        new Promise<boolean>(resolve => {
          answer = resolve;
        }),
    );
    const settings = createCallDeliverySettings({
      steps: [createStep('step')],
      storage: createStorage(),
      ask,
      now: () => NOW,
    });

    const pending = settings.ensure();
    await flush();
    expect(ask).toHaveBeenCalledTimes(1);
    await settings.ensure();
    answer(true);
    await pending;

    expect(ask).toHaveBeenCalledTimes(1);
  });

  test('logs and recovers when a check fails', async () => {
    const broken = createStep('broken');
    broken.isNeeded = jest.fn(async () => {
      throw new Error('native failure');
    });
    const warn = jest.fn();
    const settings = createCallDeliverySettings({
      steps: [broken],
      storage: createStorage(),
      ask: jest.fn(async () => true),
      logger: {warn},
    });

    await expect(settings.ensure()).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });
});
