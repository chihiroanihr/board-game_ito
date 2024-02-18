import mongoose from "mongoose";

import { RoomStatusEnum, UserStatusEnum } from "@board-game-ito/shared";

const sessionSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, default: null },
  roomId: { type: String, default: null },
  connected: { type: Boolean, required: true },
});

const userSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  status: { type: String, enum: Object.values(UserStatusEnum), required: true },
  creationTime: { type: Date, default: Date.now, required: true },
});

const roomSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  status: { type: String, required: true, enum: Object.values(RoomStatusEnum) },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  creationTime: { type: Date, required: true, default: Date.now },
  players: [
    { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  ],
});

export const Session = mongoose.model("Session", sessionSchema);
export const User = mongoose.model("User", userSchema);
export const Room = mongoose.model("Room", roomSchema);
