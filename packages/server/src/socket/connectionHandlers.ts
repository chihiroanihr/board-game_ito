import { Server, Socket } from 'socket.io';

import { type PlayerReconnectedResponse, NamespaceEnum } from '@bgi/shared';

import * as log from '../log';
import * as debug from '../debug';

/**
 * @function handleSocketConnection - Handles socket connection event
 * @param socket - Socket instance
 * @param io - Server instance
 */
export const handleSocketConnection = (socket: Socket, io: Server) => {
  debug.addConnectedSocket(socket.id);
  debug.notifyConnectedSocket(socket);
  debug.notifySocketsToAll(io);
  log.logSocketEvent('User Connected', socket);
};

/**
 * @function handleSocketReconnection - Handle socket reconnection logic
 * @description Emit player reconnected event to other players in the room
 * @socket_event - Player Reconnection
 * @param socket - Socket instance
 */
export const handleSocketReconnection = (socket: Socket) => {
  // [1] If user and room info exists in the socket instance
  if (socket.user?._id && socket.room?._id) {
    // [2] Notify player reconnected event to other players in the room (except the sender)
    /** @socket_emit */
    socket.to(socket.room._id).emit(NamespaceEnum.PLAYER_RECONNECTED, {
      socketId: socket.id,
      user: socket.user,
    } as PlayerReconnectedResponse);
  }
};

/**
 * @function handleSocketDisconnect - Handles socket disconnection event
 * @socket_event - Disconnection
 * @param socket - Socket instance
 * @param io - Server instance
 */
export const handleSocketDisconnect = (socket: Socket, io: Server) => {
  /** @socket_receive */
  socket.on(NamespaceEnum.DISCONNECT, async () => {
    // [1] Must update socket connected status first
    /** @socket_update */
    socket.connected = false;

    // [2] If database session created, proceed with transaction handling
    try {
      // If user exists
      if (socket.user?._id) {
        // If user is in a room
        if (socket.room?._id) {
          // [3] Notify all clients in the room of user disconnect (except the sender)
          /** @socket_emit */
          socket
            .to(socket.room._id)
            .emit(NamespaceEnum.PLAYER_DISCONNECTED, { socketId: socket.id, user: socket.user });
        }

        // [4] Update session connection status in database for the user disconnected
        // await handler.handleSaveSession(socket);

        // [5] Log user disconnect event
        log.logSocketEvent('User Disconnected', socket);

        /** @debug */
        debug.removeConnectedSocket(socket.id); // Remove socket from connected sockets
        debug.notifyDisconnectedSocket(socket);
        debug.notifySocketsToAll(io);
      }
    } catch (error) {
      /** @todo - Delete session or save every user info to local storage for emergency */

      // [3] Log error
      log.handleServerError(error, 'handleSocketDisconnect');
    }
  });
};
