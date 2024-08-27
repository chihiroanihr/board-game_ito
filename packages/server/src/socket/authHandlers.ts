import { Socket, Server } from 'socket.io';

import {
  type LoginCallback,
  type LogoutCallback,
  type PlayerOutResponse,
  NamespaceEnum,
} from '@bgi/shared';

import { getDB } from '../database/dbConnect';
import * as handler from '../database/handlers';
import * as log from '../log';
import * as debug from '../debug';

/**
 * @function handleSocketLogin - Handles socket login event
 * @socket_event - Login
 * @param socket - Socket instance
 * @param io - Server instance
 */
export const handleSocketLogin = (socket: Socket, io: Server) => {
  /** @socket_receive */
  socket.on(NamespaceEnum.LOGIN, async (userName: string, callback: LoginCallback) => {
    // [1] Start a new database session for transaction handling
    const dbSession = getDB().startSession();
    // [~1] If no database session, throw error
    if (!dbSession) throw new Error('[Socket Error]: Unable to start a database session.');

    // [~1] If database session created, proceed with transaction handling
    try {
      // [2] Start database transaction
      dbSession.startTransaction();

      // [3] Add new user to database using the provided username and database session, then return user object
      const newUserObj = await handler.handleLogin(userName, dbSession);

      // [4] Register new user info to socket instance
      /** @socket_update */
      socket.user = newUserObj;

      // [5] Save session to database using the provided socket instance storing user info
      await handler.handleSaveSession(socket, dbSession);

      // [6] Commit database transaction
      await dbSession.commitTransaction();

      // [7] Send back success response to client with new user object
      /** @socket_callback */
      callback({ user: newUserObj });

      // [8] Log user login event
      log.logSocketEvent('Login', socket);

      /** @debug */
      debug.addLoggedInSocket(socket.id);
      debug.notifyLoggedInSocket(socket);
      debug.notifySocketsToAll(io);
    } catch (error) {
      // [~1] If error, rollback database transaction
      if (dbSession.inTransaction()) await dbSession.abortTransaction();

      // [2] Send back error response to client
      const errorResponse = error instanceof Error ? error : new Error(String(error));
      /** @socket_callback */
      callback({ error: errorResponse });

      // [3] Log error event
      log.handleServerError(error, 'handleSocketLogin');
    } finally {
      // End database session whether successful or not
      await dbSession.endSession();
    }
  });
};

/**
 * @function handleSocketLogout - Handles socket logout event
 * @socket_event - Logout
 * @param socket - Socket instance
 * @param io - Server instance
 */
export const handleSocketLogout = (socket: Socket, io: Server) => {
  /** @socket_receive */
  socket.on(NamespaceEnum.LOGOUT, async (callback: LogoutCallback) => {
    // [1] Start a new database session for transaction handling
    const dbSession = getDB().startSession();
    // [~1] If no database session, throw error
    if (!dbSession) throw new Error('[Socket Error]: Unable to start a database session.');

    // [~1] If database session created, proceed with transaction handling
    try {
      // [2] If user is not connected, throw error
      if (!socket.user?._id) throw new Error('[Socket Error]: User is not connected.');

      // [3] If user is in a room, remove user from room and update room in database
      if (socket.room?._id) {
        // [3.1] Start database transaction
        dbSession.startTransaction();

        // [3.2] Remove user from room and update room in database (return value : Room | null (if room is deleted))
        const { user: updatedUser, room: updatedRoom } = await handler.handleLeaveRoom(
          socket.user._id,
          socket.room._id,
          socket.game?._id,
          dbSession
        );

        // [3.3] Leave socket from the room
        /** @socket_lave */
        socket.leave(socket.room._id);

        // [3.4] Update socket instance with null for room
        /** @socket_update */
        socket.room = null;
        socket.game = null;

        // [3.5] Save session to database using the provided socket instance storing session info
        await handler.handleSaveSession(socket, dbSession);

        // [3.6] Commit database transaction
        await dbSession.commitTransaction();

        // [3.7] Notify others in the room that user has left (except the sender)
        updatedRoom &&
          /** @socket_emit */
          socket.to(updatedRoom._id).emit(NamespaceEnum.PLAYER_OUT, {
            socketId: socket.id,
            user: updatedUser,
            room: updatedRoom,
          } as PlayerOutResponse);

        // [3.8] Log user leave room event
        log.logSocketEvent('Leave Room', socket);
      }

      // [4] Start database transaction
      dbSession.startTransaction();

      // [5] Logout user and delete user in database
      await handler.handleLogout(socket.user._id, dbSession);

      // [6] Update socket instance with null for user and room
      /** @socket_update */
      socket.user = null;

      // [7] Save session to database using the provided socket instance storing user info (null user and room)
      await handler.handleSaveSession(socket, dbSession);

      // [8] Commit database transaction
      await dbSession.commitTransaction();

      // [9] Send back success response to client
      /** @socket_callback */
      callback({});

      // [10] Log user logout event
      log.logSocketEvent('Logout', socket);

      /** @debug */
      debug.removeLoggedInSocket(socket.id);
      debug.notifyLoggedOutSocket(socket);
      debug.notifySocketsToAll(io);
    } catch (error) {
      // [~1] If error, rollback database transaction
      if (dbSession.inTransaction()) await dbSession.abortTransaction();

      // [2] Send back error response to client
      const errorResponse = error instanceof Error ? error : new Error(String(error));
      /** @socket_callback */
      callback({ error: errorResponse });

      // [3] Log error event
      log.handleServerError(error, 'handleSocketLogout');
    } finally {
      // End database session whether successful or not
      await dbSession.endSession();
    }
  });
};
