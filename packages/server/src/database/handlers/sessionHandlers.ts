import { ClientSession } from 'mongodb';
import { Socket } from 'socket.io';

import type { User, Room, Game, Session } from '@bgi/shared';

import * as controller from '../controllers';
import * as log from '../../log';

interface SessionData {
  _id: string;
  connected: boolean;
  user: User | null;
  room: Room | null;
  game: Game | null;
}

const handleFindSession = async (sessionId: string): Promise<SessionData | null> => {
  try {
    /** @api_call - Fetch session info (GET) */
    const session = await controller.getSessionInfo(sessionId);

    // If session does not exist
    if (!session) return null;

    // If session exists
    const { _id, userId, roomId, gameId, connected } = session;
    const user = userId ? await controller.getUserInfo(userId) : null;
    const room = roomId ? await controller.getRoomInfo(roomId) : null;
    const game = gameId ? await controller.getGameInfo(gameId) : null;

    // All success
    return { _id, connected, user, room, game };
  } catch (error) {
    throw log.handleDBError(error, 'handleFindSession');
  }
};

const handleSaveSession = async (
  socket: Socket,
  dbSession: ClientSession | null = null
): Promise<void> => {
  console.log(socket.connected);

  try {
    // Create / Update new session info
    const newSessionObj: Session = {
      _id: socket.sessionId,
      userId: socket.user?._id ?? null,
      roomId: socket.room?._id ?? null,
      gameId: socket.game?._id ?? null,
      connected: socket.connected,
    };

    /** @api_call - Upsert new session (POST & PUT) */
    const upsertSession = await controller.upsertSession(newSessionObj, dbSession);
    // Error
    if (!upsertSession) {
      throw new Error(`Failed to upsert session info (given session ID might not exist).`);
    }

    // All success
    return;
  } catch (error) {
    throw log.handleDBError(error, 'handleSaveSession');
  }
};

export { handleFindSession, handleSaveSession };
