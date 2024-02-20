import { ClientSession, ObjectId } from "mongodb";

import {
  Room,
  User,
  RoomStatusEnum,
  UserStatusEnum,
} from "@board-game-ito/shared";

import {
  saveSessionRoomId,
  updateUserStatus,
  getRoomInfo,
  updateRoomAdmin,
  insertRoom,
  deleteRoom,
  insertPlayerInRoom,
  deletePlayerFromRoom,
} from "@controller";

import { generateRandomRoomId } from "@util";
import { handleDBError } from "@debug";

/**
 * Generates unique room ID.
 * If randomly generated room ID overlaps with those in database, keep re-generating.
 * After reaching the attempts limit, stop the execution and throw an error.
 * @returns - Room ID (string)
 */
const generateUniqueRoomId = async (): Promise<string> => {
  // Limit the maximum number of attempts
  const MAX_ATTEMPTS: number = 5;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const roomId: string = generateRandomRoomId();

    /** @api_call - Fetch room info (GET) */
    const room = await getRoomInfo(roomId);

    // Success - room does not overlaps (room with given room ID doesn't exist in the DB.)
    if (!room) return roomId;
  }

  throw new Error("Failed to generate a unique room ID.");
};

export const handleCreateRoom = async (
  sessionId: string,
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
    // Error
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
    // Error
    if (!success) {
      throw new Error(
        "Failed to insert new room (there might be duplicates in the database)."
      );
    }

    /** @api_call - Update only the room ID in session (PUT) */
    const updatedSession = await saveSessionRoomId(
      sessionId,
      newRoomObj._id,
      dbSession
    );
    if (!updatedSession) {
      throw new Error(
        "Failed to update room ID in the session (given session might not exist)."
      );
    }

    // All success
    return { user: updatedUser, room: newRoomObj };
  } catch (error) {
    throw handleDBError(error, "handleCreateRoom");
  }
};

export const handleJoinRoom = async (
  sessionId: string,
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
      // Error
      if (!updatedUser)
        throw new Error(
          "Failed to update user's status (given user might not exist)."
        );

      /** @api_call - Add user to room (PUT) */
      const updatedRoom = await insertPlayerInRoom(userId, roomId, dbSession);
      // Error
      if (!updatedRoom)
        throw new Error(
          "Failed to insert new player in the room (given room might not exist)."
        );

      /** @api_call - Update only the room ID in session (PUT) */
      const updatedSession = await saveSessionRoomId(
        sessionId,
        roomId,
        dbSession
      );
      if (!updatedSession) {
        throw new Error(
          "Failed to update room ID in the session (given session might not exist)."
        );
      }

      // All success
      return { user: updatedUser, room: updatedRoom };
    }
  } catch (error) {
    throw handleDBError(error, "handleJoinRoom");
  }
};

export const handleLeaveRoom = async (
  sessionId: string,
  userId: ObjectId,
  roomId: string,
  dbSession: ClientSession | null = null
): Promise<{ user: User; room: Room | null }> => {
  let updatedRoom: Room | null;

  try {
    /** @api_call - Fetch room info from room ID (GET) */
    const room = await getRoomInfo(roomId);
    // Error
    if (!room)
      throw new Error(
        "Failed to obtain room info (given room might not exist)."
      );

    /** @api_call - Update user status (PUT) */
    const updatedUser = await updateUserStatus(
      userId,
      UserStatusEnum.IDLE,
      dbSession
    );
    // Error
    if (!updatedUser)
      throw new Error(
        "Failed to update user's status (given user might not exist)."
      );

    /** @api_call - Delete user (player) from the room (DELETE) */
    updatedRoom = await deletePlayerFromRoom(userId, roomId, dbSession);
    // Error
    if (!updatedRoom) {
      throw new Error(
        "Failed to remove a player from the room (given room or player might not exist)."
      );
    }

    // * If user leaving = room admin
    if (userId.equals(room.createdBy)) {
      const playersId = updatedRoom.players;

      // [1] If leftover players in the room -> update admin
      if (playersId.length > 0) {
        const nextAdminId = playersId[0];
        /** @api_call - Update the room admin (PUT) */
        updatedRoom = await updateRoomAdmin(nextAdminId, roomId, dbSession);
        // Error
        if (!updatedRoom) {
          throw new Error(
            "Failed to update admin of the room (given room or player might not exist)."
          );
        }
      }

      // [2] If no more players in the room -> delete room
      else {
        /** @api_call - Delete the room (DELETE) */
        const success = await deleteRoom(roomId, dbSession);
        // Error
        if (!success) {
          throw new Error(
            "Failed to delete empty room (given room might not exist)."
          );
        }
        updatedRoom = null;
      }
    }

    /** @api_call - Update only the room ID in session (PUT) */
    const updatedSession = await saveSessionRoomId(
      sessionId,
      null, // Initialize room ID
      dbSession
    );
    if (!updatedSession) {
      throw new Error(
        "Failed to update room ID in the session (given session might not exist)."
      );
    }

    // All success
    return { user: updatedUser, room: updatedRoom };
  } catch (error) {
    throw handleDBError(error, "handleLeaveRoom");
  }
};
