import crypto from 'crypto';
import { Socket } from 'socket.io';

import { type SessionResponse, NamespaceEnum } from '@bgi/shared';

import * as controller from '../database/controllers';
import * as handler from '../database/handlers';
import * as log from '../log';

/**
 * @function initializeSocketSession - Initialize socket session with session ID, connection status, and null user/room info
 * @param socket - Socket instance
 */
export function initializeSocketSession(socket: Socket): void {
  /** @socket_update */
  socket.sessionId =
    crypto.randomUUID(); /** @review OR you can re-use session ID by sessionId ?? crypto.randomUUID() */
  socket.connected = true;
  socket.user = null;
  socket.room = null;
  socket.game = null;
}

/**
 * @function checkAndRestoreSession - Check if session exists and restore session via socket instance
 * @param socket - Socket instance
 * @param sessionId - Session ID
 * @returns boolean - Session restored result
 */
export async function checkAndRestoreSession(socket: Socket, sessionId: string): Promise<boolean> {
  // [1] Find existing session from the database
  const session = await handler.handleFindSession(sessionId);
  // [~1] Session found - restore session info
  if (session) {
    // [2] Update session connection status
    if (!(await controller.saveSessionConnected(sessionId, true))) {
      // [~2] Session connection status not updated - throw error
      throw log.handleDBError(
        new Error('Failed to update session connection status.'),
        'checkAndRestoreSession'
      );
    }

    // [5] Session connection status updated, restore session info by updating socket instance
    /** @socket_update */
    socket.connected = true;
    socket.sessionId = session._id;
    socket.user = session.user;
    socket.room = session.room;
    socket.game = session.game;

    // [4] Join socket to the room if room ID in the session info exists
    /** @socket_join */
    session.room?._id && socket.join(session.room._id);

    // [5] Log session restored event & return result
    log.logSocketEvent('User Session Restored', socket);
    return true;
  }

  // [~1] Session not found - proceed to create new session
  return false;
}

/**
 * @function handleSocketSession - Handle socket session logic
 * @description Emit session info to the socket (client)
 * @socket_event - Session Info
 * @param socket - Socket instance
 */
export const handleSocketSession = (socket: Socket) => {
  // Send session info to the socket (client) when the client is connected
  /** @socket_emit */
  socket.emit(NamespaceEnum.SESSION, {
    sessionId: socket.sessionId,
    user: socket.user,
    room: socket.room,
    game: socket.game,
  } as SessionResponse);
};
