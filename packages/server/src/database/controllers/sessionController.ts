import { ClientSession, ObjectId, ReturnDocument } from 'mongodb';

import type { Session } from '@bgi/shared';

import { getDB } from '../dbConnect';
import { logQueryEvent } from '../../log';

export const getSessionInfo = async (sessionId: string): Promise<Session | null> => {
  logQueryEvent('Fetching the session info.');

  return await getDB().sessions.findOne({ _id: sessionId }); // session object or null
};

export const saveSessionConnected = async (
  sessionId: string,
  connected: boolean
): Promise<boolean> => {
  logQueryEvent('Updating only the session connection status.');

  const result = await getDB().sessions.updateOne(
    { _id: sessionId }, // Query part: find a session with this sessionId
    { $set: { connected: connected } } // Update part: set the new status
  );

  if (result.matchedCount === 0) {
    console.error('No session records were matched.');
  }
  if (result.modifiedCount === 0) {
    console.warn('Session record was matched but not modified.');
  }

  return !!result.matchedCount; // Convert into boolean
};

export const saveSessionUserId = async (
  sessionId: string,
  userId: ObjectId | null,
  dbSession: ClientSession | null = null
): Promise<Session | null> => {
  logQueryEvent('Updating only the user ID in session.');

  // Result will contain the updated or original (if no modification) document, or null if no document was found.
  return await getDB().sessions.findOneAndUpdate(
    // Filter
    { _id: sessionId }, // find a session with this _id
    // Update
    { $set: { userId: userId } }, // set the new user ID
    // Option
    dbSession
      ? {
          returnDocument: ReturnDocument.AFTER,
          session: dbSession,
          includeResultMetadata: false,
        }
      : {
          returnDocument: ReturnDocument.AFTER,
          includeResultMetadata: false,
        } // return the updated document
  );
};

export const saveSessionRoomId = async (
  sessionId: string,
  roomId: string | null,
  dbSession: ClientSession | null = null
): Promise<Session | null> => {
  logQueryEvent('Updating only the room ID in session.');

  // Result will contain the updated or original (if no modification) document, or null if no document was found.
  return await getDB().sessions.findOneAndUpdate(
    // Filter
    { _id: sessionId }, // find a session with this _id
    // Update
    { $set: { roomId: roomId } }, // set the new room ID
    // Option
    dbSession
      ? {
          returnDocument: ReturnDocument.AFTER,
          session: dbSession,
          includeResultMetadata: false,
        }
      : {
          returnDocument: ReturnDocument.AFTER,
          includeResultMetadata: false,
        } // return the updated document
  );
};

export const saveGivenUsersSessionGameId = async (
  userIds: Array<ObjectId>,
  gameId: ObjectId,
  dbSession: ClientSession | null = null
): Promise<boolean> => {
  logQueryEvent('Updating the game ID for given array of users.');

  // Update status for all users in the room
  const result = await getDB().sessions.updateMany(
    // Filter
    { userId: { $in: userIds } },
    // Update
    { $set: { gameId: gameId } },
    // Option
    dbSession ? { session: dbSession } : {}
  );

  if (result.matchedCount !== userIds.length) {
    console.error('Some user records were not matched.');
  }
  if (result.modifiedCount !== userIds.length) {
    console.warn('Some user records were matched but not modified.');
  }

  return result.matchedCount === userIds.length;
};

export const upsertSession = async (
  newSessionObj: Session,
  dbSession: ClientSession | null = null
): Promise<Session | null> => {
  logQueryEvent('Upserting new session.');

  // Destructure sessionId from newSessionObj and store the rest of the properties in sessionData
  const { _id, ...sessionData } = newSessionObj;

  // Result will contain the updated or original (if no modification) document, or null if no document was found.
  return await getDB().sessions.findOneAndUpdate(
    // Filter
    { _id: _id },
    // Update
    { $set: sessionData },
    // Option
    dbSession
      ? {
          returnDocument: ReturnDocument.AFTER,
          upsert: true,
          session: dbSession,
          includeResultMetadata: false,
        }
      : {
          returnDocument: ReturnDocument.AFTER,
          upsert: true,
          includeResultMetadata: false,
        }
  );
};

export const insertSession = async (newSessionObj: Session): Promise<boolean> => {
  logQueryEvent('Inserting new session.');

  const result = await getDB().sessions.insertOne(newSessionObj);
  return result.acknowledged; // true or false
};

export const deleteSession = async (sessionId: string): Promise<boolean> => {
  logQueryEvent('Deleting the session.');

  const result = await getDB().sessions.deleteOne({ _id: sessionId });
  return result.deletedCount === 1; // true or false
};

export const deleteAllSessions = async (): Promise<boolean> => {
  logQueryEvent('Deleting all sessions.');

  const result = await getDB().sessions.deleteMany({});
  return result.deletedCount > 0; // true or false
};
