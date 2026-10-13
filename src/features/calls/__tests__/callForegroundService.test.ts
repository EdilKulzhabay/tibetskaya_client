import type {CallState} from '../callManager';
import {
  createCallForegroundService,
  ongoingCallPeerName,
} from '../callForegroundService';

const createDeps = ({hasPermission = true} = {}) => ({
  hasMicrophonePermission: jest.fn(async () => hasPermission),
  start: jest.fn(async (_peerName: string) => {}),
  stop: jest.fn(async () => {}),
  logger: {warn: jest.fn()},
});

describe('createCallForegroundService', () => {
  it('starts the service once while the call is in progress', async () => {
    const deps = createDeps();
    const service = createCallForegroundService(deps);

    await service.update('Клиент');
    await service.update('Клиент');

    expect(deps.start).toHaveBeenCalledTimes(1);
    expect(deps.start).toHaveBeenCalledWith('Клиент');
  });

  it('does not start without microphone permission and retries on the next update', async () => {
    const deps = createDeps({hasPermission: false});
    const service = createCallForegroundService(deps);

    await service.update('Клиент');
    expect(deps.start).not.toHaveBeenCalled();

    deps.hasMicrophonePermission.mockResolvedValue(true);
    await service.update('Клиент');
    expect(deps.start).toHaveBeenCalledTimes(1);
  });

  it('stops only a running service', async () => {
    const deps = createDeps();
    const service = createCallForegroundService(deps);

    await service.update(null);
    expect(deps.stop).not.toHaveBeenCalled();

    await service.update('Клиент');
    await service.update(null);
    expect(deps.stop).toHaveBeenCalledTimes(1);
  });

  it('applies updates in order when the call ends while the service is starting', async () => {
    const deps = createDeps();
    const service = createCallForegroundService(deps);

    const starting = service.update('Клиент');
    const stopping = service.update(null);
    await Promise.all([starting, stopping]);

    expect(deps.start).toHaveBeenCalledTimes(1);
    expect(deps.stop).toHaveBeenCalledTimes(1);
    expect(deps.stop.mock.invocationCallOrder[0]).toBeGreaterThan(
      deps.start.mock.invocationCallOrder[0],
    );
  });

  it('logs a failed start and allows a retry', async () => {
    const deps = createDeps();
    deps.start.mockRejectedValueOnce(
      new Error('ForegroundServiceStartNotAllowedException'),
    );
    const service = createCallForegroundService(deps);

    await service.update('Клиент');
    expect(deps.logger.warn).toHaveBeenCalled();

    await service.update('Клиент');
    expect(deps.start).toHaveBeenCalledTimes(2);
  });
});

describe('ongoingCallPeerName', () => {
  const base = {orderId: 'o1', peerName: 'Клиент'};

  it.each<CallState>([
    {phase: 'outgoing', ...base},
    {phase: 'connecting', ...base},
    {phase: 'active', ...base, connectedAt: 0, isReconnecting: false},
  ])('returns the peer name while the microphone is in use ($phase)', call => {
    expect(ongoingCallPeerName(call)).toBe('Клиент');
  });

  it.each<CallState>([
    {phase: 'idle'},
    {phase: 'incoming', ...base},
    {phase: 'ended', peerName: 'Клиент', message: 'Звонок завершён'},
  ])('returns null when the microphone is not in use ($phase)', call => {
    expect(ongoingCallPeerName(call)).toBeNull();
  });
});
