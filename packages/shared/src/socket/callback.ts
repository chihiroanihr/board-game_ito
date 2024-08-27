import type { User, Room, Game } from '../model/data';
import type { RoomChatMessage } from './data';

export type SessionResponse = {
  sessionId: string;
  user: User | null;
  room: Room | null;
  game: Game | null;
};

/* Responses and Callbacks */

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

export type JoinRoomResponse = { error?: Error; user?: User; room?: Room | string };
export type JoinRoomCallback = {
  (response: JoinRoomResponse): void;
};

export type LeaveRoomResponse = { error?: Error };
export type LeaveRoomCallback = {
  (response: LeaveRoomResponse): void;
};

export type EditRoomResponse = { error?: Error; room?: Room };
export type EditRoomCallback = {
  (response: EditRoomResponse): void;
};

export type ChangeAdminResponse = { error?: Error };
export type ChangeAdminCallback = {
  (response: ChangeAdminResponse): void;
};

export type FetchPlayersResponse = { error?: Error; players?: User[] };
export type FetchPlayersCallback = {
  (response: FetchPlayersResponse): void;
};

export type CreateGameResponse = { error?: Error };
export type CreateGameCallback = {
  (response: CreateGameResponse): void;
};

export type StartGameResponse = { error?: Error; user?: User };
export type StartGameCallback = {
  (response: StartGameResponse): void;
};

export type InGameResponse = {
  error?: Error;
  user?: User;
  room?: Room;
  game?: Game;
};
export type InGameCallback = {
  (response: InGameResponse): void;
};

export type SendChatResponse = { error?: Error };
export type SendChatCallback = {
  (response: SendChatResponse): void;
};

export type MicReadyResponse = { error?: Error };
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
  error?: Error;
  roomsDeleted?: boolean;
  usersDeleted?: boolean;
  sessionsDeleted?: boolean;
};
export type InitializeCallback = {
  (response: InitializeResponse): void;
};
