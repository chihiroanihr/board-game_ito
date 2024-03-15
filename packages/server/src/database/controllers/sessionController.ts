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
): Promise<{ matched: boolean; modified: boolean }> => {
  logQueryEvent('Updating only the session connection status.');

  const result = await getDB().sessions.updateOne(
    { _id: sessionId }, // Query part: find a session with this sessionId
    { $set: { connected: connected } } // Update part: set the new status
  );

  return {
    matched: result.matchedCount > 0,
    modified: result.modifiedCount > 0,
  }; // true or false
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

export const saveSessionUserAndRoomId = async (
  sessionId: string,
  userId: ObjectId,
  roomId: string,
  dbSession: ClientSession | null = null
): Promise<Session | null> => {
  logQueryEvent('Updating both the user ID and room ID in session.');

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
    { _id: sessionId }, // Query to match the session by its _id
    { $set: { userId: userId, roomId: roomId } }, // Update both userId and roomId
    options
  );
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
