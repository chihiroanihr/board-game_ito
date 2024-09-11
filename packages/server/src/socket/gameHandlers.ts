import { Socket, Server } from 'socket.io';

import {
  type CreateGameCallback,
  type InGameCallback,
  UserStatusEnum,
  NamespaceEnum,
} from '@bgi/shared';

import { getDB } from '../database/dbConnect';
import * as handler from '../database/handlers';
import * as controller from '../database/controllers';
import * as log from '../log';

/**
 * @function handleSocketCreateGame - Handles socket create game event
 * @socket_event - Create Game
 * @param socket - Socket instance
 * @param io - Socket.IO server instance
 */
export const handleSocketCreateGame = (socket: Socket, io: Server) => {
  /** @socket_receive */
  socket.on(NamespaceEnum.CREATE_GAME, async (callback: CreateGameCallback) => {
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

      // [4] Create a new game and update room status
      const { room: updatedRoom, game: newGame } = await handler.handleCreateGame(
        socket.room._id,
        dbSession
      );
      // [~4] If failed to create a new game (failed to initialize rounds array), throw error
      if (!newGame.rounds[0]?._id)
        throw new Error('Failed to initialize a round object in the created game.');

      // [5] Broadcast game creating status to all clients in the room
      /** @socket_emit */
      io.to(updatedRoom._id).emit(NamespaceEnum.GAME_CREATING);

      // [6] Update status of all players in the room to PLAYING
      if (
        !(await controller.updateGivenUsersStatus(
          updatedRoom.players,
          UserStatusEnum.PLAYING,
          dbSession
        ))
      ) {
        // ERROR
        throw new Error(
          'Failed to update status in the users database for given players (some of the players might not exist).'
        );
      }

      // [7] Assign admin as first player to choose theme card
      if (
        !(await controller.updateRoundThemeChosenBy(
          socket.user._id, // player ID
          newGame._id, // game ID
          newGame.rounds[0]._id, // round ID
          dbSession
        ))
      ) {
        // ERROR
        throw new Error('Failed to update "themeChosenBy" user for given round in the game.');
      }

      // [8] Save Session: Update game IDs in the session database for all players in the room
      if (
        !(await controller.saveGivenUsersSessionGameId(updatedRoom.players, newGame._id, dbSession))
      ) {
        // ERROR
        throw new Error(
          'Failed to update game IDs in the sessions database for given players (some of the players might not exist).'
        );
      }

      // [9] Commit database transaction
      await dbSession.commitTransaction();

      // [10] Notify game started event to all clients in the room (except the sender)
      /** @socket_io_emit */
      io.to(updatedRoom._id).emit(NamespaceEnum.GAME_CREATED);

      // [11] Send back success response to client
      /** @socket_callback */
      callback({});

      // [12] Log create game event
      log.logSocketEvent('Create Game', socket);
    } catch (error) {
      // [~1] If error, rollback database transaction
      if (dbSession && dbSession.inTransaction()) await dbSession.abortTransaction();

      // [2] Broadcast game creation failure to all clients in the room
      /** @socket_emit */
      if (socket.room?._id) io.to(socket.room._id).emit(NamespaceEnum.GAME_CREATE_FAILED);

      // [3] Send back error response to client
      /** @socket_callback */
      callback({ error });

      // [4] Log error event
      log.handleServerError(error, 'handleSocketCreateGame');
    } finally {
      // End database session whether successful or not
      await dbSession.endSession();
    }
  });
};

/**
 * @function handleSocketInGame - Handles socket in game event
 * @socket_event - In Game
 * @param socket - Socket instance
 */
export const handleSocketInGame = (socket: Socket) => {
  /** @socket_receive */
  socket.on(NamespaceEnum.IN_GAME, async (sessionId: string, callback: InGameCallback) => {
    try {
      // [1] Find existing session from the database
      const session = await handler.handleFindSession(sessionId);

      // [2] If session found, with user, room and game info exists
      if (session && session.user && session.room && session.game) {
        // [3] Update socket instance with these session info
        /** @socket_update */
        socket.user = session.user;
        socket.room = session.room;
        socket.game = session.game;

        // [5] Send back success response to client with updated info
        /** @socket_callback */
        callback({ user: session.user, room: session.room, game: session.game });
      } else {
        // [~2] If session not found, throw error
        throw new Error('Session not found.');
      }

      // [5] Log in game event
      log.logSocketEvent('In Game', socket);
    } catch (error) {
      // [1] If error, send back error response to client
      /** @socket_callback */
      callback({ error });

      // [2] Log error event
      log.handleServerError(error, 'handleSocketInGame');
    }
  });
};
