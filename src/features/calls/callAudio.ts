import InCallManager from 'react-native-incall-manager';

const RINGTONE_VIBRATION_PATTERN = [0, 800, 1200];
/** Чуть больше серверного таймаута дозвона (40 c), чтобы рингтон не оборвался раньше */
const RINGTONE_MAX_SECONDS = 45;

export interface CallAudio {
  startIncomingRingtone(): void;
  stopIncomingRingtone(): void;
  /** Аудиосессия звонка + гудки дозвона у звонящего */
  startOutgoing(): void;
  /** Аудиосессия звонка у принявшего (без гудков) */
  startSession(): void;
  stopRingback(): void;
  stopSession(): void;
  setSpeaker(isOn: boolean): void;
}

/**
 * InCallManager переключает аудио в режим звонка (разговорный динамик, датчик приближения
 * гасит экран у уха) и проигрывает системный рингтон/гудки.
 */
export const inCallAudio: CallAudio = {
  startIncomingRingtone: () =>
    InCallManager.startRingtone(
      '_DEFAULT_',
      RINGTONE_VIBRATION_PATTERN,
      'playback',
      RINGTONE_MAX_SECONDS,
    ),
  stopIncomingRingtone: () => InCallManager.stopRingtone(),
  startOutgoing: () =>
    InCallManager.start({media: 'audio', ringback: '_DTMF_'}),
  startSession: () => InCallManager.start({media: 'audio'}),
  stopRingback: () => InCallManager.stopRingback(),
  stopSession: () => InCallManager.stop(),
  setSpeaker: isOn => InCallManager.setForceSpeakerphoneOn(isOn),
};
