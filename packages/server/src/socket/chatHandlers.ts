import { Socket, Server } from 'socket.io';

import { type RoomChatMessage, type SendChatCallback, NamespaceEnum } from '@bgi/shared';

import * as log from '../log';

/**
 * @function handleSocketChatMessage - Handles socket chat message event
 * @socket_event - Send Chat
 * @param socket - Socket instance
 * @param io - Server instance
 */
export const handleSocketChatMessage = (socket: Socket, io: Server) => {
  /** @socket_receive */
  socket.on(
    NamespaceEnum.SEND_CHAT,
    async (chatData: RoomChatMessage, callback: SendChatCallback) => {
      // [0] Receive chat message from client and broadcast to all users in the room
      try {
        // [1] Validate user and room exists (if user is not connected and user is not in a room, throw error)
        if (!socket.user?._id) throw new Error('[Socket Error]: User is not connected.');
        if (!socket.room?._id) throw new Error('[Socket Error]: Room is not connected.');

        // [2] Broadcast (send) chat message to all users in the room
        /** @socket_io_emit */
        io.to(socket.room._id).emit(NamespaceEnum.RECEIVE_CHAT, chatData);

        // [3] Send back success response to client
        callback({});

        // [4] Log send chat event
        log.logSocketEvent('Send Chat', socket);
      } catch (error) {
        // [~0] Send back error response to client
        /** @socket_callback */
        callback({ error });

        // [1] Log error event
        log.handleServerError(error, 'handleSocketChatMessage');
      }
    }
  );
};
