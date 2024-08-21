import { Socket, Server } from 'socket.io';

import {
  type RoomSetting,
  type CreateRoomCallback,
  type EditRoomCallback,
  type ChangeAdminCallback,
  type JoinRoomCallback,
  type LeaveRoomCallback,
  type WaitRoomCallback,
  type RoomEditedResponse,
  type AdminChangedResponse,
  type PlayerInResponse,
  type PlayerOutResponse,
  type User,
  type Room,
  NamespaceEnum,
} from '@bgi/shared';

import { getDB } from '../database/dbConnect';
import * as handler from '../database/handlers';
import * as controller from '../database/controllers';
import * as log from '../log';

/**
 * @function handleSocketCreateRoom - Handles socket create room event
 * @socket_event - Create Room
 * @param socket - Socket instance
 */
export const handleSocketCreateRoom = (socket: Socket) => {
  /** @socket_receive */
  socket.on(
    NamespaceEnum.CREATE_ROOM,
    async (roomSetting: RoomSetting, callback: CreateRoomCallback) => {
      // [1] Start a new database session for transaction handling
      const dbSession = getDB().startSession();
      // [~1] If no database session, throw error
      if (!dbSession) throw new Error('[Socket Error]: Unable to start a database session.');

      // [~1] If database session created, proceed with transaction handling
      try {
        // [2] If user is not connected, throw error
        if (!socket.user?._id) throw new Error('[Socket Error]: User is not connected.');

        // [3] Start database transaction
        dbSession.startTransaction();

        // [4] Create a new room with given user as admin, then return updated user and new room data
        const { user: updatedUser, room: updatedRoom } = await handler.handleCreateRoom(
          socket.sessionId,
          socket.user._id,
          roomSetting,
          dbSession
        );

        // [5] Update socket instance with new user and room info
        /** @socket_update */
        socket.user = updatedUser;
        socket.room = updatedRoom;

        // [6] Join the socket to a socket room
        /** @socket_join */
        socket.join(updatedRoom._id);

        // [7] Save session to database using provided socket instance storing updated user and room data
        await handler.handleSaveSession(socket, dbSession);

        // [8] Commit the transaction
        await dbSession.commitTransaction();

        // [9] Notify other players in the room that a new player has joined (except the sender)
        /** @socket_emit */
        socket.to(updatedRoom._id).emit(NamespaceEnum.PLAYER_IN, {
          socketId: socket.id,
          user: updatedUser,
          room: updatedRoom,
        } as PlayerInResponse);

        // [10] Send back success response to client with updated user and room
        /** @socket_callback */
        callback({ user: updatedUser, room: updatedRoom });

        // [11] Log socket event
        log.logSocketEvent('Create Room', socket);
      } catch (error) {
        // [~1] If an error occurs, abort the transaction if it exists
        if (dbSession && dbSession.inTransaction()) await dbSession.abortTransaction();

        // [2] Send back error response to client
        const errorResponse = error instanceof Error ? error : new Error(String(error));
        /** @socket_callback */
        callback({ error: errorResponse });

        // [3] Log socket error
        log.handleServerError(error, 'handleSocketCreateRoom');
      } finally {
        // End the session whether success or failure
        await dbSession.endSession();
      }
    }
  );
};

/**
 * @function handleSocketEditRoom - Handles socket edit room event
 * @socket_event - Edit Room
 * @param socket - Socket instance
 */
export const handleSocketEditRoom = (socket: Socket) => {
  /** @socket_receive */
  socket.on(
    NamespaceEnum.EDIT_ROOM,
    async (roomSetting: RoomSetting, callback: EditRoomCallback) => {
      try {
        // [1] Validate user and room exists (if user is not connected and user is not in a room, throw error)
        if (!socket.user?._id) throw new Error('[Socket Error]: User is not connected.');
        if (!socket.room?._id) throw new Error('[Socket Error]: Room is not connected.');

        // [2] Edit room with given room setting, then return updated room data
        const updatedRoom = await handler.handleEditRoom(socket.room._id, roomSetting);

        // [3] Update socket instance with new room info (no need to save session due to keeping same room ID)
        /** @socket_update */
        socket.room = updatedRoom;

        // [4] Notify other players in the room that the room has been edited (except the sender)
        /** @socket_emit */
        socket
          .to(updatedRoom._id)
          .emit(NamespaceEnum.ROOM_EDITED, { room: updatedRoom } as RoomEditedResponse);

        // [5] Send back success response to client with updated room data
        /** @socket_callback */
        callback({ room: updatedRoom });

        // [6] Log edit room event
        log.logSocketEvent('Edit Room', socket);
      } catch (error) {
        // [1] Send back error response to client
        const errorResponse = error instanceof Error ? error : new Error(String(error));
        /** @socket_callback */
        callback({ error: errorResponse });

        // [2] Log error event
        log.handleServerError(error, 'handleSocketEditRoom');
      }
    }
  );
};

/**
 * @function handleSocketChangeAdmin - Handles socket change admin event
 * @socket_event - Change Admin
 * @param socket - Socket instance
 * @param io - Socket.IO instance
 */
export const handleSocketChangeAdmin = (socket: Socket, io: Server) => {
  /** @socket_receive */
  socket.on(NamespaceEnum.CHANGE_ADMIN, async (newAdmin: User, callback: ChangeAdminCallback) => {
    try {
      // [2] Validate user and room exists (if user is not connected and user is not in a room, throw error)
      if (!socket.user?._id) throw new Error('[Socket Error]: User is not connected.');
      if (!socket.room?._id) throw new Error('[Socket Error]: Room is not connected.');

      // [3] Change admin with given new admin, then return updated room data
      const updatedRoom = await handler.handleChangeAdmin(socket.room._id, newAdmin._id);

      // [3] Update socket instance with new room info (no need to save session due to keeping same room ID)
      /** @socket_update */
      socket.room = updatedRoom;

      // [4] Broadcast to everyone in the room that the admin has been changed
      io.to(socket.room._id).emit(NamespaceEnum.ADMIN_CHANGED, {
        user: newAdmin,
        room: updatedRoom,
      } as AdminChangedResponse);

      // [5] Send back success response to client
      /** @socket_callback */
      callback({});

      // [6] Log change admin event
      log.logSocketEvent('Change Admin', socket);
    } catch (error) {
      // [1] Send back error response to client
      const errorResponse = error instanceof Error ? error : new Error(String(error));
      /** @socket_callback */
      callback({ error: errorResponse });

      // [2] Log error event
      log.handleServerError(error, 'handleSocketChangeAdmin');
    }
  });
};

/**
 * @function handleSocketLeaveRoom - Handles socket leave room event
 * @socket_event - Leave Room
 * @param socket - Socket instance
 */
export const handleSocketLeaveRoom = (socket: Socket) => {
  /** @socket_receive */
  socket.on(NamespaceEnum.LEAVE_ROOM, async (callback: LeaveRoomCallback) => {
    // [1] Start a new database session for transaction handling
    const dbSession = getDB().startSession();
    // [~1] If no database session, throw error
    if (!dbSession) throw new Error('[Socket Error]: Unable to start a database session.');

    // [~1] If database session created, proceed with transaction handling
    try {
      // [2] Validate user and room exists (if user is not connected and user is not in a room, throw error)
      if (!socket.user?._id) throw new Error('[Socket Error]: User is not connected.');
      if (!socket.room?._id) throw new Error('[Socket Error]: Room is not connected.');

      // [3] Start database transaction
      dbSession.startTransaction();

      // [4] Remove user from room and update room in database (return value : Room | null (if room is deleted))
      const { user: updatedUser, room: updatedRoom } = await handler.handleLeaveRoom(
        socket.sessionId,
        socket.user._id,
        socket.room._id,
        dbSession
      );

      // [5] Save session to database using the provided socket instance storing user info (null user and room)
      await handler.handleSaveSession(socket, dbSession);

      // [6] Commit database transaction
      await dbSession.commitTransaction();

      // [7] Leave socket from the room
      /** @socket_lave */
      socket.leave(socket.room._id);

      // [8] Update socket instance with null for room
      /** @socket_update */
      socket.room = null;

      // [9] Notify others in the room that user has left (except the sender)
      updatedRoom &&
        /** @socket_emit */
        socket.to(updatedRoom._id).emit(NamespaceEnum.PLAYER_OUT, {
          socketId: socket.id,
          user: updatedUser,
          room: updatedRoom,
        } as PlayerOutResponse);

      // [10] Send back success response to clients
      /** @socket_callback */
      callback({});

      // [11] Log user leave room event
      log.logSocketEvent('Leave Room', socket);
    } catch (error) {
      // [~1] If error, rollback database transaction
      if (dbSession && dbSession.inTransaction()) await dbSession.abortTransaction();

      // [2] Send back error response to client
      const errorResponse = error instanceof Error ? error : new Error(String(error));
      /** @socket_callback */
      callback({ error: errorResponse });

      // [3] Log error event
      log.handleServerError(error, 'handleSocketLeaveRoom');
    } finally {
      // End database session whether successful or not
      await dbSession.endSession();
    }
  });
};

/**
 * @function handleSocketJoinRoom - Handles socket join room event
 * @socket_event - Join Room
 * @param socket - Socket instance
 */
export const handleSocketJoinRoom = (socket: Socket) => {
  /** @socket_receive */
  socket.on(NamespaceEnum.JOIN_ROOM, async (roomId: string, callback: JoinRoomCallback) => {
    // [1] Start a new database session for transaction handling
    const dbSession = getDB().startSession();
    // [~1] If no database session, throw error
    if (!dbSession) throw new Error('[Socket Error]: Unable to start a database session.');

    // [~1] If database session created, proceed with transaction handling
    try {
      // [2] If user is not connected, throw error
      if (!socket.user?._id) throw new Error('[Socket Error]: User is not connected.');

      // [3] Start database transaction
      dbSession.startTransaction();

      // [4] Join user to room and update room in database
      const response = await handler.handleJoinRoom(
        socket.sessionId,
        socket.user._id,
        roomId,
        dbSession
      );

      // [~4] If user can join room
      if (typeof response === 'object') {
        // [4.1] Extract the result
        const { user: updatedUser, room: updatedRoom } = response;

        // [4.2] Update socket instance with new user and room info
        /** @socket_update */
        socket.user = updatedUser;
        socket.room = updatedRoom;

        // [4.3] Join the socket to a socket room
        /** @socket_join */
        socket.join(updatedRoom._id);

        // [4.4] Save session to database using the provided socket instance storing session info (updated user and room)
        await handler.handleSaveSession(socket, dbSession);

        // [4.5] Commit the transaction
        await dbSession.commitTransaction();

        // [4.6] Notify other players in the room that a new player has joined (except the sender)
        /** @socket_emit */
        socket.to(updatedRoom._id).emit(NamespaceEnum.PLAYER_IN, {
          socketId: socket.id,
          user: updatedUser,
          room: updatedRoom,
        } as PlayerInResponse);

        // [4.7] Send back success response to client with updated user and room info
        callback({ user: updatedUser, room: updatedRoom });
      }

      // [~4] If user cannot join room  // else if (typeof response === "string")
      else {
        // [4.1] Send back error response to client
        callback({ room: response });

        // [4.2] Commit the transaction
        await dbSession.commitTransaction();
      }

      // [5] Log user join room event
      log.logSocketEvent('Join Room', socket);
    } catch (error) {
      // [~1] If error, rollback database transaction
      if (dbSession && dbSession.inTransaction()) await dbSession.abortTransaction();

      // [2] Send back error response to client
      const errorResponse = error instanceof Error ? error : new Error(String(error));
      /** @socket_callback */
      callback({ error: errorResponse });

      // [3] Log error event
      log.handleServerError(error, 'handleSocketJoinRoom');
    } finally {
      // End database session whether successful or not
      await dbSession.endSession();
    }
  });
};

/**
 * @function handleSocketWaitRoom - Handles socket wait room event
 * @socket_event - Wait Room
 * @param socket - Socket instance
 */
export const handleSocketWaitRoom = (socket: Socket) => {
  /** @socket_receive */
  socket.on(NamespaceEnum.WAIT_ROOM, async (room: Room, callback: WaitRoomCallback) => {
    try {
      // [2] Validate user and room exists (if user is not connected and user is not in a room, throw error)
      if (!socket.user?._id) throw new Error('[Socket Error]: User is not connected.');
      if (!socket.room?._id) throw new Error('[Socket Error]: Room is not connected.');

      // [3] Convert all player IDs to "User" objects
      const players = await controller.convertPlayerIdsToPlayerObjs(room.players);

      // [4] Send back success response to client with updated players info
      /** @socket_callback */
      callback({ players: players });

      // [5] Log user wait room event
      log.logSocketEvent('Wait Room', socket);
    } catch (error) {
      // [1] If error, send back error response to client
      const errorResponse = error instanceof Error ? error : new Error(String(error));
      /** @socket_callback */
      callback({ error: errorResponse });

      // [2] Log error event
      log.handleServerError(error, 'handleSocketWaitRoom');
    }
  });
};
