import type { User, Room, Game } from '../model/data';
import type { RoomChatMessage } from './data';

export type SessionResponse = {
  sessionId: string;
  user: User | null;
  room: Room | null;
  game: Game | null;
};

/* Responses and Callbacks */

export type LoginResponse = { error?: unknown; user?: User };
export type LoginCallback = {
  (response: LoginResponse): void;
};

export type LogoutResponse = { error?: unknown };
export type LogoutCallback = {
  (response: LogoutResponse): void;
};

export type CreateRoomResponse = { error?: unknown; user?: User; room?: Room };
export type CreateRoomCallback = {
  (response: CreateRoomResponse): void;
};

export type JoinRoomResponse = { error?: unknown; user?: User; room?: Room | string };
export type JoinRoomCallback = {
  (response: JoinRoomResponse): void;
};

export type LeaveRoomResponse = { error?: unknown };
export type LeaveRoomCallback = {
  (response: LeaveRoomResponse): void;
};

export type EditRoomResponse = { error?: unknown; room?: Room };
export type EditRoomCallback = {
  (response: EditRoomResponse): void;
};

export type ChangeAdminResponse = { error?: unknown };
export type ChangeAdminCallback = {
  (response: ChangeAdminResponse): void;
};

export type FetchPlayersResponse = { error?: unknown; players?: User[] };
export type FetchPlayersCallback = {
  (response: FetchPlayersResponse): void;
};

export type CreateGameResponse = { error?: unknown };
export type CreateGameCallback = {
  (response: CreateGameResponse): void;
};

export type InGameResponse = {
  error?: unknown;
  user?: User;
  room?: Room;
  game?: Game;
};
export type InGameCallback = {
  (response: InGameResponse): void;
};

export type SendChatResponse = { error?: unknown };
export type SendChatCallback = {
  (response: SendChatResponse): void;
};

export type MicReadyResponse = { error?: unknown };
export type MicReadyCallback = {
  (response: MicReadyResponse): void;
};

export type SendIceCandidate = {};
export type SendIceCandidateCallback = {};

export type SendVoiceOffer = {};
export type SendVoiceOfferCallback = {};

export type SendVoiceAnswer = {};
export type SendVoiceAnswerCallback = {};

/* Responses only */

export type RoomEditedResponse = { room: Room };

export type AdminChangedResponse = { user: User; room: Room };

export type PlayerDisconnectedResponse = { socketId: string; user: User };

export type PlayerReconnectedResponse = { socketId: string; user: User };

export type PlayerInResponse = { socketId: string; user: User; room: Room };

export type PlayerOutResponse = { socketId: string; user: User; room: Room | null };

export type ReceiveChatResponse = RoomChatMessage;

export type PlayerMicReadyResponse = { socketId: string };

export type ReceiveIceCandidateResponse = { candidate: RTCIceCandidate; fromSocketId: string };

export type ReceiveVoiceOfferResponse = { signal: RTCSessionDescriptionInit; fromSocketId: string };

export type ReceiveVoiceAnswerResponse = {
  signal: RTCSessionDescriptionInit;
  fromSocketId: string;
};

/** @debug */

export type InitializeResponse = {
  error?: unknown;
  roomsDeleted?: boolean;
  usersDeleted?: boolean;
  sessionsDeleted?: boolean;
};
export type InitializeCallback = {
  (response: InitializeResponse): void;
};
