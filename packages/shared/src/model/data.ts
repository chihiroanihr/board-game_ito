import { ObjectId } from 'mongodb';

import { RoomStatusEnum, UserStatusEnum, CommunicationMethodEnum, LanguageEnum } from './enum';

export interface Session {
  _id: string;
  userId: ObjectId | null; // User._id
  roomId: string | null; // Room._id
  connected: boolean;
}

export interface User {
  _id: ObjectId;
  name: string;
  status: UserStatusEnum;
  creationTime: Date;
}

export interface Room {
  _id: string;
  status: RoomStatusEnum;
  roomAdmin: ObjectId; // User._id
  creationTime: Date;
  players: Array<ObjectId>; // User._id
  setting: RoomSetting;
  // chat: RoomChat -> array of ChatMessageInfo
}

export interface RoomSetting {
  numRound: number;
  answerThemeTime: number;
  answerNumberTime: number;
  heartEnabled: boolean;
  dupNumCard: boolean;
  communicationMethod: CommunicationMethodEnum;
}

/** @todo - unused */
export interface ChatMessageInfo {
  _id: ObjectId;
  sender: ObjectId; // User._id
  content: string;
  creationTime: Date;
}

export interface Theme {
  _id: ObjectId;
  language: LanguageEnum;
  title: string;
  captionLow: string;
  captionHigh: string;
  reference: string | null;
}
