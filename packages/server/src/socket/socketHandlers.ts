import { Server, Socket } from 'socket.io';

import { type User, type Room, type InitializeCallback, NamespaceEnum } from '@bgi/shared';

import * as connectionHandlers from './connectionHandlers';
import * as sessionHandlers from './sessionHandlers';
import * as authHandlers from './authHandlers';
import * as roomHandlers from './roomHandlers';
import * as chatHandlers from './chatHandlers';
import * as voiceHandlers from './voiceHandlers';
import * as controller from '../database/controllers';
import * as debug from '../debug';
import * as log from '../log';

import { getDB } from '../database/dbConnect';

declare module 'socket.io' {
  interface Socket {
    sessionId: string;
    connected: boolean;
    user: User | null;
    room: Room | null;
  }
}

const socketHandlers = (io: Server) => {
  // Socket.IO middleware
  // Prevent from current session to change every time the low-level connection between the client and the server is severed.
  io.use(async (socket: Socket, next: (arg0: Error | undefined) => void) => {
    try {
      // [1] Extract session ID (private) sent from client which will be used to authenticate the user upon reconnection
      const sessionId = socket.handshake.auth.sessionId;
      // * Session ID not found from the client
      if (!sessionId) {
        // [2] Create a new session
        sessionHandlers.initializeSocketSession(socket);
        log.logSocketEvent('User Session Created', socket);
      }
      // * Session ID found from the client
      else {
        // [2] Assign session info to socket
        const sessionRestored = await sessionHandlers.checkAndRestoreSession(socket, sessionId);
        // * No matching session ID found from the server
        if (!sessionRestored) {
          // [3] Create a new session
          sessionHandlers.initializeSocketSession(socket);
          log.logSocketEvent('User Session Created (no matching session)', socket);
        }
      }
      next(undefined);
    } catch (error) {
      log.handleServerError(error, 'io.use()');
      socket.emit('error');
      next(new Error('Internal server error'));
    }
  });

  // The io variable can be used to do all the necessary things regarding Socket
  io.on('connection', (socket: Socket) => {
    socket.emit('connected');

    // Socket handling logic (moved from the previous file)
    connectionHandlers.handleSocketConnection(socket, io);
    connectionHandlers.handleSocketReconnection(socket);
    sessionHandlers.handleSocketSession(socket);
    connectionHandlers.handleSocketDisconnect(socket, io);
    authHandlers.handleSocketLogin(socket, io);
    authHandlers.handleSocketLogout(socket, io);
    roomHandlers.handleSocketCreateRoom(socket);
    roomHandlers.handleSocketEditRoom(socket);
    roomHandlers.handleSocketJoinRoom(socket);
    roomHandlers.handleSocketWaitRoom(socket);
    roomHandlers.handleSocketLeaveRoom(socket);
    roomHandlers.handleSocketChangeAdmin(socket, io);
    chatHandlers.handleSocketChatMessage(socket, io);
    voiceHandlers.handleSocketMicReady(socket);
    voiceHandlers.handleSocketVoiceOffer(socket, io);
    voiceHandlers.handleSocketVoiceAnswer(socket, io);
    voiceHandlers.handleSocketIceCandidate(socket, io);

    handleSocketInitialize(socket, io);

    /** @/debug */
    console.log(`\n[*] ${io.engine.clientsCount} sockets connected.`);
    console.log(socket.rooms);
    // const rooms = io.sockets.adapter.rooms;

    // const rooms = io.sockets.adapter.rooms;
    // if (rooms.get('6F0ADF17')) {
    //   rooms.get('6F0ADF17')?.forEach((socketId) => {
    //     console.log(`Socket ID: ${socketId}`);
    //   });
    // }
  });
};

/** @debug */
const handleSocketInitialize = (socket: Socket, io: Server) => {
  socket.on(NamespaceEnum.DEBUG_INITIALIZE, async (callback: InitializeCallback) => {
    // Start a new session for the transaction
    const dbSession = getDB().startSession();
    if (!dbSession) {
      throw new Error('[Socket Error]: Unable to start a database session.');
    }

    try {
      // Start a transaction session
      dbSession.startTransaction();
      // [1] Delete all rooms, users, and sessions
      // Use Promise.all to wait for both requests to complete
      const results = await Promise.all([
        controller.deleteAllRooms(),
        controller.deleteAllUsers(),
        controller.deleteAllSessions(),
      ]);
      // [2] Simplify the response based on the delete operations' success
      const [roomsDeleted, usersDeleted, sessionsDeleted] = results.map(
        (result: boolean) => !!result
      );
      // Commit the transaction
      await dbSession.commitTransaction();
      /** [3] @socket_emit - Send back result to client */
      callback({
        roomsDeleted: roomsDeleted,
        usersDeleted: usersDeleted,
        sessionsDeleted: sessionsDeleted,
      });
      /** [4] @socket_update - Initialize socket */
      socket.sessionId = '';
      socket.connected = false;
      socket.user = null;
      socket.room = null;

      debug.initializeSocketSets();
      debug.notifySocketsToAll(io);
      log.logSocketEvent('Initialize', socket);
    } catch (error) {
      // If an error occurs, abort the transaction if it exists
      if (dbSession && dbSession.inTransaction()) {
        await dbSession.abortTransaction();
      }
      /** @socket_emit - Send back error to client */
      callback({ error: error instanceof Error ? error : new Error(String(error)) });

      log.handleServerError(error, 'handleSocketInitialize');
    } finally {
      // End the session whether success or failure
      await dbSession.endSession();
    }
  });
};

export default socketHandlers;
