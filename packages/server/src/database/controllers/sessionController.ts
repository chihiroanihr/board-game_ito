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
    console.error('Session record was not matched.');
  }
  if (result.modifiedCount === 0) {
    console.warn('Session record was matched but not modified.');
  }

  return result.matchedCount > 0; // true or false
};

export const saveSessionUserId = async (
  sessionId: string,
  userId: ObjectId | null,
  dbSession: ClientSession | null = null
): Promise<Session | null> => {
  logQueryEvent('Updating only the user ID in session.');

  const options = dbSession
    ? {
        returnDocument: ReturnDocument.AFTER,
        session: dbSession,
        includeResultMetadata: false,
      }
    : {
        returnDocument: ReturnDocument.AFTER,
        includeResultMetadata: false,
      }; // return the updated document

  // Result will contain the updated or original (if no modification) document,
  // or null if no document was found.
  return await getDB().sessions.findOneAndUpdate(
    { _id: sessionId }, // Query part: find a session with this _id
    { $set: { userId: userId } }, // Update part: set the new user ID
    options
  );
};

export const saveSessionRoomId = async (
  sessionId: string,
  roomId: string | null,
  dbSession: ClientSession | null = null
): Promise<Session | null> => {
  logQueryEvent('Updating only the room ID in session.');

  const options = dbSession
    ? {
        returnDocument: ReturnDocument.AFTER,
        session: dbSession,
        includeResultMetadata: false,
      }
    : {
        returnDocument: ReturnDocument.AFTER,
        includeResultMetadata: false,
      }; // return the updated document

  // Result will contain the updated or original (if no modification) document,
  // or null if no document was found.
  return await getDB().sessions.findOneAndUpdate(
    { _id: sessionId }, // Query part: find a session with this _id
    { $set: { roomId: roomId } }, // Update part: set the new room ID
    options
  );
};

export const saveGivenUsersSessionGameId = async (
  userIds: Array<ObjectId>,
  gameId: ObjectId,
  dbSession: ClientSession | null = null
): Promise<boolean> => {
  logQueryEvent('Updating the game ID for given array of users.');

  // Options object
  const options = dbSession ? { session: dbSession } : {};

  // Update status for all users in the room
  const result = await getDB().sessions.updateMany(
    { userId: { $in: userIds } },
    { $set: { gameId: gameId } },
    options
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

  // Options object
  const options = dbSession
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
      }; // return the updated document

  // Result will contain the updated or original (if no modification) document,
  // or null if no document was found.
  return await getDB().sessions.findOneAndUpdate({ _id: _id }, { $set: sessionData }, options);
};

export const insertSession = async (newSessionObj: Session): Promise<boolean> => {
  logQueryEvent('Inserting new session.');

  const result = await getDB().sessions.insertOne(newSessionObj);
  return result.acknowledged; // true or false
};

export const saveSession = async (
  newSessionObj: Session
): Promise<{ matched: boolean; modified: boolean }> => {
  logQueryEvent('Updating the session info.');

  // Destructure sessionId from newSessionObj and store the rest of the properties in sessionData
  const { _id, ...sessionData } = newSessionObj;

  const result = await getDB().sessions.updateOne({ _id: _id }, { $set: sessionData });

  return {
    matched: result.matchedCount > 0,
    modified: result.modifiedCount > 0,
  }; // true or false
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
