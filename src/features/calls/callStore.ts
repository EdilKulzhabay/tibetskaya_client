import {useSyncExternalStore} from 'react';
import {tokenStorage} from '../../utils/storage';
import {inCallAudio} from './callAudio';
import {CallManager, CallSnapshot} from './callManager';
import {createCallPeer} from './callPeer';
import {callPlatform} from './callPlatform';
import {createSignalingClient, fetchIceServers} from './callSignaling';

/** Один менеджер на приложение: у клиента не бывает двух звонков одновременно */
export const callManager = new CallManager({
  getToken: () => tokenStorage.getAuthToken(),
  createSignaling: createSignalingClient,
  fetchIceServers,
  createPeer: createCallPeer,
  audio: inCallAudio,
  fallbackCaller: {type: 'courier', name: 'Курьер'},
  systemUi: callPlatform.systemUi,
});

export const useCallSnapshot = (): CallSnapshot =>
  useSyncExternalStore(callManager.subscribe, callManager.getSnapshot);
