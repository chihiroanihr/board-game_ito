import { type User } from '@bgi/shared';

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
  ADMIN = 'change-admin',
  KICK = 'kick-player',
  BAN = 'ban-player',
}

export type SnackbarPlayerInQueueInfoType =
  | {
      key: number;
      player: User;
      status: PlayerInQueueActionEnum;
    }
  | undefined;
