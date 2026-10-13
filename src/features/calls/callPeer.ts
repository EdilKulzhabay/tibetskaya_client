import {
  mediaDevices,
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from 'react-native-webrtc';
import {MicrophonePermissionError} from './callErrors';
import {requestBluetoothPermission} from './callPermissions';
import {
  IceCandidatePayload,
  IceServer,
  SessionDescriptionPayload,
  SignalKind,
  SignalPayload,
} from './callTypes';

export type PeerConnectionStatus = 'connected' | 'reconnecting' | 'failed';

export interface CallPeerHandlers {
  onLocalSignal: (kind: SignalKind, payload: SignalPayload) => void;
  onConnectionChange: (status: PeerConnectionStatus) => void;
}

export interface CallPeerLike {
  createOffer(): Promise<void>;
  handleSignal(kind: SignalKind, payload: SignalPayload): Promise<void>;
  setMuted(muted: boolean): void;
  close(): void;
}

const isSessionDescription = (
  payload: SignalPayload,
): payload is SessionDescriptionPayload =>
  'sdp' in payload && typeof payload.sdp === 'string';

const isIceCandidate = (
  payload: SignalPayload,
): payload is IceCandidatePayload =>
  'candidate' in payload && typeof payload.candidate === 'string';

interface IceCandidateEventLike {
  candidate: RTCIceCandidate | null;
}

const CONNECTION_STATUS_MAP: Partial<Record<string, PeerConnectionStatus>> = {
  connected: 'connected',
  disconnected: 'reconnecting',
  failed: 'failed',
};

/**
 * Аудио-соединение 1:1. Удалённый звук в react-native-webrtc воспроизводится сам,
 * без RTCView. ICE-кандидаты, пришедшие до remote description, буферизуются:
 * addIceCandidate до setRemoteDescription падает.
 */
class CallPeer implements CallPeerLike {
  private pendingCandidates: IceCandidatePayload[] = [];
  private isClosed = false;

  constructor(
    private readonly pc: RTCPeerConnection,
    private readonly localStream: MediaStream,
    private readonly handlers: CallPeerHandlers,
  ) {
    // Свойства on* вместо addEventListener: в react-native-webrtc 124.x .d.ts ссылаются на
    // ./vendor/event-target-shim, которого нет в пакете, и унаследованные методы не типизируются.
    pc.onicecandidate = (event: unknown) => {
      const {candidate} = event as IceCandidateEventLike;
      if (!candidate) {
        return;
      }
      handlers.onLocalSignal('ice', {
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid ?? null,
        sdpMLineIndex: candidate.sdpMLineIndex ?? null,
      });
    };
    pc.onconnectionstatechange = () => {
      const status = CONNECTION_STATUS_MAP[pc.connectionState];
      if (status) {
        handlers.onConnectionChange(status);
      }
    };
  }

  async createOffer(): Promise<void> {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    this.handlers.onLocalSignal('offer', {type: 'offer', sdp: offer.sdp});
  }

  async handleSignal(kind: SignalKind, payload: SignalPayload): Promise<void> {
    if (this.isClosed) {
      return;
    }

    if (kind === 'ice') {
      if (!isIceCandidate(payload)) {
        return;
      }
      if (this.pc.remoteDescription) {
        await this.pc.addIceCandidate(new RTCIceCandidate(payload));
      } else {
        this.pendingCandidates.push(payload);
      }
      return;
    }

    if (!isSessionDescription(payload)) {
      return;
    }
    await this.pc.setRemoteDescription(new RTCSessionDescription(payload));
    await this.flushPendingCandidates();

    if (kind === 'offer') {
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      this.handlers.onLocalSignal('answer', {type: 'answer', sdp: answer.sdp});
    }
  }

  setMuted(muted: boolean): void {
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = !muted;
    });
  }

  close(): void {
    if (this.isClosed) {
      return;
    }
    this.isClosed = true;
    this.localStream.getTracks().forEach(track => track.stop());
    this.pc.close();
  }

  private async flushPendingCandidates(): Promise<void> {
    const candidates = this.pendingCandidates;
    this.pendingCandidates = [];
    await Promise.all(
      candidates.map(candidate =>
        this.pc.addIceCandidate(new RTCIceCandidate(candidate)),
      ),
    );
  }
}

const getMicrophoneStream = async (): Promise<MediaStream> => {
  try {
    return await mediaDevices.getUserMedia({audio: true, video: false});
  } catch {
    throw new MicrophonePermissionError();
  }
};

export const createCallPeer = async (
  iceServers: IceServer[],
  handlers: CallPeerHandlers,
): Promise<CallPeerLike> => {
  await requestBluetoothPermission();
  const localStream = await getMicrophoneStream();
  const pc = new RTCPeerConnection({iceServers});
  localStream
    .getAudioTracks()
    .forEach(track => pc.addTrack(track, localStream));
  return new CallPeer(pc, localStream, handlers);
};
