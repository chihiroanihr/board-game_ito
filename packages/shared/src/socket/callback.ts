import type { User, Room } from '../model/data';
import type { RoomChatMessage } from './data';

export type SessionResponse = { sessionId: string; user: User | null; room: Room | null };

export type LoginResponse = { error?: Error; user?: User };
export type LoginCallback = {
  (response: LoginResponse): void;
};

export type LogoutResponse = { error?: Error };
export type LogoutCallback = {
  (response: LogoutResponse): void;
};

export type CreateRoomResponse = { error?: Error; user?: User; room?: Room };
export type CreateRoomCallback = {
  (response: CreateRoomResponse): void;
};

export type EditRoomResponse = { error?: Error; room?: Room };
export type EditRoomCallback = {
  (response: EditRoomResponse): void;
};

export type JoinRoomResponse = { error?: Error; user?: User; room?: Room | string };
export type JoinRoomCallback = {
  (response: JoinRoomResponse): void;
};

export type WaitRoomResponse = { error?: Error; players?: User[] };
export type WaitRoomCallback = {
  (response: WaitRoomResponse): void;
};

export type LeaveRoomResponse = { error?: Error };
export type LeaveRoomCallback = {
  (response: LeaveRoomResponse): void;
};

export type MicReadyResponse = { error?: Error };
export type MicReadyCallback = {
  (response: MicReadyResponse): void;
};

export type SendChatResponse = { error?: Error };
export type SendChatCallback = {
  (response: SendChatResponse): void;
};

export type SendIceCandidate = {};
export type SendIceCandidateCallback = {};

export type SendVoiceOffer = {};
export type SendVoiceOfferCallback = {};

export type SendVoiceAnswer = {};
export type SendVoiceAnswerCallback = {};

export type PlayerDisconnectedResponse = { socketId: string; user: User };

export type PlayerReconnectedResponse = { socketId: string; user: User };

export type PlayerInResponse = { socketId: string; user: User; room: Room };

export type PlayerOutResponse = { socketId: string; user: User; room: Room | null };

export type PlayerMicReadyResponse = { socketId: string };

export type ReceiveChatResponse = RoomChatMessage;

export type ReceiveIceCandidateResponse = { candidate: RTCIceCandidate; fromSocketId: string };

export type ReceiveVoiceOfferResponse = { signal: RTCSessionDescriptionInit; fromSocketId: string };

export type ReceiveVoiceAnswerResponse = {
  signal: RTCSessionDescriptionInit;
  fromSocketId: string;
};

export type RoomEditedResponse = { room: Room };

export type InitializeResponse = {
  error?: Error;
  roomsDeleted?: boolean;
  usersDeleted?: boolean;
  sessionsDeleted?: boolean;
};
export type InitializeCallback = {
  (response: InitializeResponse): void;
};
