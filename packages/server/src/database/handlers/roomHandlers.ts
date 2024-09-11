import { ClientSession, ObjectId } from 'mongodb';

import {
  type Room,
  type User,
  type RoomSetting,
  RoomStatusEnum,
  UserStatusEnum,
  MAX_NUM_PLAYERS,
} from '@bgi/shared';

import * as controller from '../controllers';
import * as util from '../../utils';
import * as log from '../../log';

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
    const roomId: string = util.generateRandomRoomId();

    /** @api_call - Fetch room info (GET) */
    if (!(await controller.getRoomInfo(roomId)))
      // Success - room does not overlaps (room with given room ID doesn't exist in the DB.)
      return roomId;
  }

  throw new Error('Failed to generate a unique room ID.');
};

export const handleCreateRoom = async (
  userId: ObjectId,
  roomSetting: RoomSetting,
  dbSession: ClientSession | null = null
): Promise<{ user: User; room: Room }> => {
  try {
    // Generate unique room ID
    const roomId: string = await generateUniqueRoomId();

    /** @api_call - Update user info (PUT) */
    const updatedUser = await controller.updateUserStatus(
      userId,
      UserStatusEnum.PENDING,
      dbSession
    );
    // Error
    if (!updatedUser)
      throw new Error("Failed to update user's status (given user might not exist).");

    // Create a new room
    const newRoomObj: Room = {
      _id: roomId, // Use roomId directly if it's not intended to be an ObjectId
      status: RoomStatusEnum.AVAILABLE,
      creationTime: new Date(),
      roomAdmin: userId,
      players: [userId],
      setting: roomSetting,
    };

    /** @api_call - Insert new room (POST) */
    const success = await controller.insertRoom(newRoomObj, dbSession);
    // Error
    if (!success)
      throw new Error('Failed to insert new room (there might be duplicates in the database).');

    // All success
    return { user: updatedUser, room: newRoomObj };
  } catch (error) {
    throw log.handleDBError(error, 'handleCreateRoom');
  }
};

export const handleEditRoom = async (
  roomId: string,
  newRoomSetting: RoomSetting,
  dbSession: ClientSession | null = null
): Promise<Room> => {
  try {
    /** @api_call - Update room setting (PUT) */
    const updatedRoom = await controller.updateRoomSetting(roomId, newRoomSetting, dbSession);
    if (!updatedRoom)
      throw new Error('Failed to update room setting (given room ID might not exist).');

    // All success
    return updatedRoom;
  } catch (error) {
    throw log.handleDBError(error, 'handleEditRoom');
  }
};

export const handleJoinRoom = async (
  userId: ObjectId,
  roomId: string,
  dbSession: ClientSession | null = null
): Promise<string | { user: User; room: Room }> => {
  try {
    /** @api_call - Obtain room info from the database (GET) */
    const room = await controller.getRoomInfo(roomId);

    // If room does not exist
    if (!room) return 'This room does not exist.';
    // If room exists but playing
    else if (room.status === RoomStatusEnum.PLAYING) return 'This room is currently playing.';
    // If room exists but full
    else if (room.status === RoomStatusEnum.FULL) return 'This room is full of players.';
    // If room exists and not full
    else {
      if (room.players.length >= 9) {
        /** @api_call - Update room status (PUT) */
        if (!(await controller.updateRoomStatus(roomId, RoomStatusEnum.FULL, dbSession)))
          // Error
          throw new Error("Failed to update room's status (given room might not exist).");
      }

      /** @api_call - Update user status (PUT) */
      const updatedUser = await controller.updateUserStatus(
        userId,
        UserStatusEnum.PENDING,
        dbSession
      );
      // Error
      if (!updatedUser)
        throw new Error("Failed to update user's status (given user might not exist).");

      /** @api_call - Add user to room (PUT) */
      const updatedRoom = await controller.insertPlayerInRoom(userId, roomId, dbSession);
      // Error
      if (!updatedRoom)
        throw new Error('Failed to insert new player in the room (given room might not exist).');

      // All success
      return { user: updatedUser, room: updatedRoom };
    }
  } catch (error) {
    throw log.handleDBError(error, 'handleJoinRoom');
  }
};

export const handleLeaveRoom = async (
  userId: ObjectId,
  roomId: string,
  gameId: ObjectId | null = null,
  dbSession: ClientSession | null = null
): Promise<{ user: User; room: Room | null }> => {
  try {
    /** @api_call - Fetch room info from room ID (GET) */
    const room = await controller.getRoomInfo(roomId);
    if (!room) throw new Error('Failed to obtain room info (given room might not exist).');

    /** @api_call - Update room status (PUT) */
    if (room.players.length <= MAX_NUM_PLAYERS)
      if (!(await controller.updateRoomStatus(roomId, RoomStatusEnum.AVAILABLE, dbSession)))
        // Error
        throw new Error("Failed to update room's status (given room might not exist).");

    /** @api_call - Update user status (PUT) */
    const updatedUser = await controller.updateUserStatus(userId, UserStatusEnum.IDLE, dbSession);
    if (!updatedUser)
      throw new Error("Failed to update user's status (given user might not exist).");

    /** @api_call - Delete user (player) from the room (DELETE) */
    let updatedRoom = await controller.deletePlayerFromRoom(userId, roomId, dbSession);
    if (!updatedRoom)
      throw new Error(
        'Failed to remove a player from the room (given room or player might not exist).'
      );

    // * If user leaving = room admin
    if (userId.equals(room.roomAdmin)) {
      // [1] If leftover players in the room -> update admin
      const playersId = updatedRoom.players;
      if (playersId?.[0]) {
        const nextAdminId = playersId[0];
        /** @api_call - Update the room admin (PUT) */
        updatedRoom = await controller.updateRoomAdmin(nextAdminId, roomId, dbSession);
        if (!updatedRoom)
          throw new Error(
            'Failed to update admin of the room (given room or player might not exist).'
          );
      }

      // [2] If no more players in the room -> delete room
      else {
        /** @api_call - Delete the game if running (DELETE) */
        if (gameId && !(await controller.deleteGame(gameId, dbSession))) {
          throw new Error('Game deletion failed.');
        }
        /** @api_call - Delete the room (DELETE) */
        if (!(await controller.deleteRoom(roomId, dbSession))) {
          throw new Error('Room deletion failed.');
        }
        updatedRoom = null;
      }
    }

    // All success
    return { user: updatedUser, room: updatedRoom };
  } catch (error) {
    throw log.handleDBError(error, 'handleLeaveRoom');
  }
};

export const handleChangeAdmin = async (
  roomId: string,
  newAdminId: ObjectId,
  dbSession: ClientSession | null = null
): Promise<Room> => {
  try {
    /** @api_call - Update room admin (PUT) */
    const updatedRoom = await controller.updateRoomAdmin(newAdminId, roomId, dbSession);
    if (!updatedRoom) throw new Error('Failed to update room admin (given room might not exist).');

    // All success
    return updatedRoom;
  } catch (error) {
    throw log.handleDBError(error, 'handleChangeAdmin');
  }
};
