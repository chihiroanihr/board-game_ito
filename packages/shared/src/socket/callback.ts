import type { User, Room } from '../model/data';

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

export type WaitRoomResponse = { error?: Error; players?: User[] };
export type WaitRoomCallback = {
  (response: WaitRoomResponse): void;
};

export type LeaveRoomResponse = { error?: Error };
export type LeaveRoomCallback = {
  (response: LeaveRoomResponse): void;
};

export type InitializeResponse = {
  error?: Error;
  roomsDeleted?: boolean;
  usersDeleted?: boolean;
  sessionsDeleted?: boolean;
};
export type InitializeCallback = {
  (response: InitializeResponse): void;
};
