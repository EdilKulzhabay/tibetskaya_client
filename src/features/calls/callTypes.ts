/**
 * Контракт с бэкендом (crm/calls): namespace Socket.io `/calls` и GET /calls/ice-servers.
 * Держать в синхроне с crm/calls/callConstants.js.
 */

export type ParticipantType = 'client' | 'courier';
export type SignalKind = 'offer' | 'answer' | 'ice';
export type CallEndStatus =
  | 'ended'
  | 'rejected'
  | 'missed'
  | 'cancelled'
  | 'failed';

export interface PeerInfo {
  type: ParticipantType;
  name: string;
}

export interface SessionDescriptionPayload {
  type: 'offer' | 'answer';
  sdp: string;
}

export interface IceCandidatePayload {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}

export type SignalPayload = SessionDescriptionPayload | IceCandidatePayload;

export interface IncomingCallEvent {
  callId: string;
  orderId: string;
  caller: PeerInfo;
}

export interface CallAcceptedEvent {
  callId: string;
}

export interface CallEndedEvent {
  callId: string;
  orderId: string;
  status: CallEndStatus;
  reason: string;
  endedBy: ParticipantType | null;
  durationSec: number;
}

export interface CallSignalEvent {
  callId: string;
  kind: SignalKind;
  payload: SignalPayload;
}

export interface CallResumeEvent {
  callId: string;
  orderId: string;
  status: 'ringing' | 'accepted';
  role: 'caller' | 'callee';
}

export interface InviteResult {
  callId: string;
  orderId: string;
  callee: PeerInfo;
}

export interface CallIdResult {
  callId: string;
}

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface IceServersResponse {
  success: boolean;
  iceServers: IceServer[];
  ttlSec: number;
}

export interface CallApiError {
  code: string;
  message: string;
}

export type AckResponse<T> =
  | {ok: true; data: T}
  | {ok: false; error: CallApiError};

export interface ServerToClientEvents {
  'call:incoming': (event: IncomingCallEvent) => void;
  'call:accepted': (event: CallAcceptedEvent) => void;
  'call:ended': (event: CallEndedEvent) => void;
  'call:signal': (event: CallSignalEvent) => void;
  'call:resume': (event: CallResumeEvent) => void;
}

export interface ClientToServerEvents {
  'call:invite': (
    data: {orderId: string},
    ack: (res: AckResponse<InviteResult>) => void,
  ) => void;
  'call:accept': (
    data: {callId: string},
    ack: (res: AckResponse<CallIdResult>) => void,
  ) => void;
  'call:reject': (
    data: {callId: string},
    ack: (res: AckResponse<CallIdResult>) => void,
  ) => void;
  'call:end': (
    data: {callId: string},
    ack: (res: AckResponse<CallIdResult>) => void,
  ) => void;
  'call:signal': (
    data: {callId: string; kind: SignalKind; payload: SignalPayload},
    ack: (res: AckResponse<null>) => void,
  ) => void;
}
