import { Socket } from "socket.io";

import {
  upsertSession,
  getSessionInfo,
  getUserInfo,
  getRoomInfo,
} from "../controllers/index.js";

import { User, Room, Session } from "../interfaces/IData.js";

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

    return { _id, connected, user, room };
  } catch (error) {
    throw new Error(
      `[Server Error]: Failed to fetch session info.\n
      ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

const handleSaveSession = async (socket: Socket): Promise<void> => {
  try {
    // Create / Update new session info
    const newSessionObj: Session = {
      _id: socket.sessionId,
      userId: socket.userId,
      roomId: socket.roomId,
      connected: socket.connected,
    };

    /** @api_call - Upsert new session (POST & PUT) */
    const { modified, inserted } = await upsertSession(newSessionObj);
    if (!modified && !inserted) {
      throw new Error(
        `Failed to update / newly insert session info (given session ID might not exist).`
      );
    }

    // All success
    return;
  } catch (error) {
    throw new Error(
      `[Server Error]: Failed to save session data.\n
      ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export { handleFindSession, handleSaveSession };
