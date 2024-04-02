import { type User } from '@bgi/shared';

export type LoginFormDataType = {
  name: string;
};

export type JoinRoomFormDataType = {
  roomId: string;
};

export type SnackbarPlayerInfoType =
  | {
      key: number;
      player: User;
      status: 'in' | 'out';
    }
  | undefined;
