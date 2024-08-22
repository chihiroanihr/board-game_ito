import { ObjectId } from 'mongodb';

import {
  RoomStatusEnum,
  UserStatusEnum,
  CommunicationMethodEnum,
  RoundStatusEnum,
  LanguageEnum,
} from './enum';

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
export interface Game {
  _id: ObjectId;
  roomId: string; // Room._id
  rounds: Array<Round>; // Round records
  cardsAvailable: number[]; // [1, 2, 3, ..., 100]
  startTime: Date;
  endTime: Date;
}

export interface Round {
  _id: ObjectId;
  roundNumber: number; // Round number (maximum value: 10 as 10 rounds)
  theme: Theme; // Selected theme for this round
  playerCards: Array<PlayerCard>; // Cards submitted by each players
  status: RoundStatusEnum; // Update from "playing", whether this round was "success" or "fail"
}

export interface PlayerCard {
  _id: ObjectId;
  playerId: ObjectId; // User._id
  cardNumber: number;
  order: number; // Card submitted order, from 1 to maximum number of players
}

/** @todo - unused, save once when game starts, retrieve all the history at game-in-progress screen */
export interface Chat {
  _id: ObjectId;
  roomId: string; // Room._id
  messages: Array<ChatMessageInfo>;
}

export interface ChatMessageInfo {
  _id: ObjectId;
  sender: ObjectId; // User._id
  content: string;
  sendTime: Date;
}

export interface Theme {
  _id: ObjectId;
  language: LanguageEnum;
  title: string;
  captionLow: string;
  captionHigh: string;
  reference: string | null;
}
