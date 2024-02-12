import { ClientSession, ObjectId } from "mongodb";
import { RoomStatusEnum, UserStatusEnum } from "@board-game-ito/shared";

import {
  updateUserStatus,
  getRoomInfo,
  insertRoom,
  deleteRoom,
  getAllPlayersInRoom,
  insertPlayerInRoom,
  deletePlayerFromRoom,
  updateRoomAdmin,
} from "../controllers/index.ts";

import { Room, User } from "../interfaces/IData.ts";
import { generateRandomRoomId } from "../utils/generateRandomId.js";

const generateUniqueRoomId = async (): Promise<string> => {
  const MAX_ATTEMPTS: number = 5; // Limit the maximum number of attempts

  // If randomly generated room ID overlaps with those in database, keep re-generating.
  // After the reduced max waiting time or attempts limit, throw an error
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const roomId: string = generateRandomRoomId();

    /** @api_call - Fetch room info (GET) */
    const room = await getRoomInfo(roomId);
    if (!room) return roomId;
  }

  throw new Error("Failed to generate a unique room ID.");
};

export const handleCreateRoom = async (
  userId: ObjectId,
  dbSession: ClientSession | null = null
): Promise<{ user: User; room: Room }> => {
  try {
    // Generate unique room ID
    const roomId: string = await generateUniqueRoomId();

    /** @api_call - Update user info (PUT) */
    const updatedUser = await updateUserStatus(
      userId,
      UserStatusEnum.PENDING,
      dbSession
    );
    if (!updatedUser)
      throw new Error(
        "Failed to update user's status (given user might not exist)."
      );

    // Create a new room
    const newRoomObj: Room = {
      _id: roomId, // Use roomId directly if it's not intended to be an ObjectId
      status: RoomStatusEnum.AVAILABLE,
      creationTime: new Date(),
      createdBy: userId,
      players: [userId],
    };

    /** @api_call - Insert new room (POST) */
    const success = await insertRoom(newRoomObj, dbSession);
    if (!success) {
      throw new Error(
        "Failed to insert new room (there might be duplicates in the database)."
      );
    }

    return { user: updatedUser, room: newRoomObj };
  } catch (error) {
    throw new Error(
      `[Server Error]: Failed to add new room.\n${error.message}`
    );
  }
};

export const handleLeaveRoom = async (
  userId: ObjectId,
  roomId: string
): Promise<Room | null> => {
  let updatedRoom: Room | null;

  try {
    /** @api_call - Fetch room info from room ID (GET) */
    const room = await getRoomInfo(roomId);
    if (!room)
      throw new Error(
        "Failed to obtain room info (given room might not exist)."
      );

    /** @api_call - Delete user (player) from the room (DELETE) */
    updatedRoom = await deletePlayerFromRoom(userId, roomId);
    if (!updatedRoom) {
      throw new Error(
        "Failed to remove player from the room (given room or player might not exist)."
      );
    }

    // * If user = room admin
    if (userId.equals(room.createdBy)) {
      /** @api_call - Fetch all players in the room (GET) */
      const playersId = await getAllPlayersInRoom(roomId);
      if (!playersId) {
        throw new Error(
          "Failed to obtain all the players in the room (given room might not exist)."
        );
      }

      // [1] If leftover players in the room -> update admin
      if (playersId.length > 0) {
        const nextAdminId = playersId[0];
        /** @api_call - Update the room admin (PUT) */
        updatedRoom = await updateRoomAdmin(nextAdminId, roomId);
        if (!updatedRoom) {
          throw new Error(
            "Failed to update admin of the room (given room or player might not exist)."
          );
        }
      }

      // [2] If no more players in the room -> delete room
      else {
        /** @api_call - Delete the room (DELETE) */
        if (!(await deleteRoom(roomId))) {
          throw new Error(
            "Failed to delete empty room (given room might not exist)."
          );
        }
        updatedRoom = null;
      }
    }

    // All success
    return updatedRoom;
  } catch (error) {
    throw new Error(`[Server Error]: Failed to leave room.\n${error.message}`);
  }
};

export const handleJoinRoom = async (
  userId: ObjectId,
  roomId: string,
  dbSession: ClientSession | null = null
): Promise<string | { user: User; room: Room }> => {
  try {
    /** @api_call - Obtain room info from the database (GET) */
    const room = await getRoomInfo(roomId);
    // If room does not exist
    if (!room) {
      return "This room does not exist.";
    }
    //  If room exists but playing
    else if (room.status === RoomStatusEnum.PLAYING) {
      return "This room is currently playing.";
    }
    //  If room exists but full
    else if (room.status === RoomStatusEnum.FULL) {
      return "This room is full of players.";
    }

    // If room exists and not full
    else {
      /** @api_call - Update user status (PUT) */
      const updatedUser = await updateUserStatus(
        userId,
        UserStatusEnum.PENDING,
        dbSession
      );
      if (!updatedUser)
        throw new Error(
          "Failed to update user's status (given user might not exist)."
        );

      /** @api_call - Add user to room (PUT) */
      const updatedRoom = await insertPlayerInRoom(userId, roomId, dbSession);
      if (!updatedRoom)
        throw new Error(
          "Failed to insert new player in the room (given room might not exist)."
        );

      return { user: updatedUser, room: updatedRoom };
    }
  } catch (error) {
    throw new Error(
      `[Server Error]: Failed to add player in the room.\n${error.message}`
    );
  }
};
