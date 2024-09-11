import type { User } from '../model/data';

export interface RoomChatMessage {
  fromUser: User;
  message: string;
  timestamp: number;
}

export interface RTCIceCandidateData {
  candidate: RTCIceCandidate;
  toSocketId: string;
}

export interface RTCSessionDescriptionData {
  signal: RTCSessionDescriptionInit;
  toSocketId: string;
}
