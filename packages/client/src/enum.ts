import { type User } from '@bgi/shared';
import { ObjectId } from 'mongodb';

export type LoginFormDataType = {
  name: string;
};

export type JoinRoomFormDataType = {
  roomId: string;
};

export type SendChatFormDataType = {
  message: string;
};

export enum PlayerInQueueActionEnum {
  IN = 'player-in',
  OUT = 'player-out',
  KICK = 'kick-player',
  BAN = 'ban-player',
}

export enum RoomEditedActionEnum {
  EDIT = 'edit-room',
  ADMIN = 'change-admin',
}

export type SnackbarPlayerInQueueInfoType =
  | {
      key: number;
      player: User;
      status: PlayerInQueueActionEnum;
    }
  | undefined;

export type SnackbarRoomEditedInfoType =
  | {
      key: number;
      player: User | undefined;
      status: RoomEditedActionEnum;
    }
  | undefined;

export type GameLayoutOutletContextType = {
  adminId: ObjectId;
  players: Array<User>;
  activeSpeakers: Array<string>;
  synchronousBlock: boolean;
};

export type SetUpPeerConnectionType = {
  peerConnection: RTCPeerConnection;
  toSocketId: string;
};

export type PeerConnectionsDataType = {
  [key: string]: RTCPeerConnection | undefined;
};
