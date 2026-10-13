jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Свежий модуль — без кеша в памяти, как после перезапуска приложения */
const loadModule = (): typeof import('../deviceId') => {
  let loaded: typeof import('../deviceId') | undefined;
  jest.isolateModules(() => {
    loaded = require('../deviceId');
  });
  return loaded!;
};

describe('createDeviceId', () => {
  it('returns a UUID v4', () => {
    const {createDeviceId} = loadModule();
    expect(createDeviceId()).toMatch(UUID_V4);
    expect(createDeviceId(() => 0)).toBe(
      '00000000-0000-4000-8000-000000000000',
    );
  });
});

describe('getDeviceId', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
  });

  it('creates the id once and keeps it across app restarts', async () => {
    const first = await loadModule().getDeviceId();
    const afterRestart = await loadModule().getDeviceId();

    expect(first).toMatch(UUID_V4);
    expect(afterRestart).toBe(first);
  });

  it('returns null when storage fails so ordering is not blocked', async () => {
    jest
      .spyOn(AsyncStorage, 'getItem')
      .mockRejectedValueOnce(new Error('disk'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const {getDeviceId} = loadModule();

    expect(await getDeviceId()).toBeNull();
    expect(await getDeviceId()).toMatch(UUID_V4);
  });
});
