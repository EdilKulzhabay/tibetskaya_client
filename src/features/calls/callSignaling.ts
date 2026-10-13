import {io, Socket} from 'socket.io-client';
import api from '../../api/axios';
import {getDeviceId} from '../../utils/deviceId';
import {
  CallRequestError,
  NETWORK_ERROR_CODE,
  UNAUTHORIZED_ERROR_CODE,
} from './callErrors';
import {
  AckResponse,
  ClientToServerEvents,
  IceServer,
  IceServersResponse,
  InviteResult,
  ServerToClientEvents,
  SignalKind,
  SignalPayload,
} from './callTypes';

const CALLS_NAMESPACE = '/calls';
const ACK_TIMEOUT_MS = 10_000;
const RECONNECTION_DELAY_MAX_MS = 5_000;

type CallSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface CallSignalingClient {
  on<E extends keyof ServerToClientEvents>(
    event: E,
    handler: ServerToClientEvents[E],
  ): void;
  onUnauthorized(handler: () => void): void;
  invite(orderId: string): Promise<InviteResult>;
  accept(callId: string): Promise<void>;
  reject(callId: string): Promise<void>;
  end(callId: string): Promise<void>;
  signal(
    callId: string,
    kind: SignalKind,
    payload: SignalPayload,
  ): Promise<void>;
  disconnect(): void;
}

const unwrap = <T>(response: AckResponse<T>): T => {
  if (!response.ok) {
    throw new CallRequestError(response.error.code, response.error.message);
  }
  return response.data;
};

/** Ack не пришёл за ACK_TIMEOUT_MS или сокет отключён — показываем как сетевую ошибку. */
const withNetworkError = async <T>(
  request: Promise<AckResponse<T>>,
): Promise<T> => {
  let response: AckResponse<T>;
  try {
    response = await request;
  } catch {
    throw new CallRequestError(
      NETWORK_ERROR_CODE,
      'Нет соединения с сервером. Проверьте интернет',
    );
  }
  return unwrap(response);
};

export const createSignalingClient = (token: string): CallSignalingClient => {
  const socket: CallSocket = io(`${api.defaults.baseURL}${CALLS_NAMESPACE}`, {
    // Функция вызывается на каждое (пере)подключение. deviceId: входящие по заказам,
    // созданным на этом устройстве, приходят только сюда
    auth: callback => {
      getDeviceId().then(deviceId => callback({token, deviceId}));
    },
    transports: ['websocket'],
    reconnectionDelayMax: RECONNECTION_DELAY_MAX_MS,
  });
  const timed = () => socket.timeout(ACK_TIMEOUT_MS);

  return {
    on: (event, handler) => {
      // Типы socket.io не выводят связь event → handler для generic-параметра
      socket.on(event, handler as never);
    },
    onUnauthorized: handler => {
      socket.on('connect_error', error => {
        if (error.message === UNAUTHORIZED_ERROR_CODE) {
          handler();
        }
      });
    },
    invite: orderId =>
      withNetworkError(timed().emitWithAck('call:invite', {orderId})),
    accept: async callId => {
      await withNetworkError(timed().emitWithAck('call:accept', {callId}));
    },
    reject: async callId => {
      await withNetworkError(timed().emitWithAck('call:reject', {callId}));
    },
    end: async callId => {
      await withNetworkError(timed().emitWithAck('call:end', {callId}));
    },
    signal: async (callId, kind, payload) => {
      await withNetworkError(
        timed().emitWithAck('call:signal', {callId, kind, payload}),
      );
    },
    disconnect: () => {
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
};

export const fetchIceServers = async (): Promise<IceServer[]> => {
  try {
    const {data} = await api.get<IceServersResponse>('/calls/ice-servers');
    if (!data.success || !Array.isArray(data.iceServers)) {
      throw new Error('invalid ice-servers response');
    }
    return data.iceServers;
  } catch {
    throw new CallRequestError(
      NETWORK_ERROR_CODE,
      'Звонки временно недоступны. Попробуйте позже',
    );
  }
};
