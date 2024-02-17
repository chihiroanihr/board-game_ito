import { ObjectId } from "mongodb";
import { RoomStatusEnum, UserStatusEnum } from "@board-game-ito/shared";

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
  createdBy: ObjectId; // User._id
  creationTime: Date;
  players: ObjectId[]; // User._id
}
