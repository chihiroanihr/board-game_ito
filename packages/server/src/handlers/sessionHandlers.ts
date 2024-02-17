import { ClientSession } from "mongodb";
import { Socket } from "socket.io";
import { User, Room, Session } from "@board-game-ito/shared/interfaces";

import {
  upsertSession,
  getSessionInfo,
  getUserInfo,
  getRoomInfo,
} from "../controllers";
import { handleDBError } from "../utils";

interface SessionData {
  _id: string;
  connected: boolean;
  user: User | null;
  room: Room | null;
}

const handleFindSession = async (
  sessionId: string
): Promise<SessionData | false> => {
  try {
    /** @api_call - Fetch session info (GET) */
    const session = await getSessionInfo(sessionId);

    // If session does not exist
    if (!session) return false;

    // If session exists
    const { _id, userId, roomId, connected } = session;
    const user = userId ? await getUserInfo(userId) : null;
    const room = roomId ? await getRoomInfo(roomId) : null;

    // All success
    return { _id, connected, user, room };
  } catch (error) {
    throw handleDBError(error, "handleFindSession");
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
      userId: socket.userId,
      roomId: socket.roomId,
      connected: socket.connected,
    };

    /** @api_call - Upsert new session (POST & PUT) */
    const session = await upsertSession(newSessionObj, dbSession);
    // Error
    if (!session) {
      throw new Error(
        `Failed to upsert session info (given session ID might not exist).`
      );
    }

    // All success
    return;
  } catch (error) {
    throw handleDBError(error, "handleSaveSession");
  }
};

export { handleFindSession, handleSaveSession };
