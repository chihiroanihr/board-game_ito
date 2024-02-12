import { getDB } from "../database/dbConnect";
import { Session } from "../interfaces/IData";
import { logQueryEvent } from "../utils/log";

export const getSessionInfo = async (
  sessionId: string
): Promise<Session | null> => {
  logQueryEvent("Fetching the session info.");

  try {
    return await getDB().sessions.findOne({ _id: sessionId }); // session object or null
  } catch (error) {
    throw error;
  }
};

export const updateSessionConnected = async (
  sessionId: string,
  connected: boolean
): Promise<{ matched: boolean; modified: boolean }> => {
  logQueryEvent("Updating only the session connection status.");

  try {
    const result = await getDB().sessions.updateOne(
      { _id: sessionId }, // Query part: find a session with this sessionId
      { $set: { connected: connected } } // Update part: set the new status
    );

    return {
      matched: result.matchedCount > 0,
      modified: result.modifiedCount > 0,
    }; // true or false
  } catch (error) {
    throw error;
  }
};

export const upsertSession = async (
  newSessionObj: Session
): Promise<{ modified: boolean; inserted: boolean }> => {
  logQueryEvent("Upserting new session.");

  try {
    // Destructure sessionId from newSessionObj and store the rest of the properties in sessionData
    const { _id, ...sessionData } = newSessionObj;

    const result = await getDB().sessions.updateOne(
      { _id: _id },
      { $set: sessionData },
      { upsert: true } // Upsert option
    );

    // Check if anything was modified or upserted
    return {
      modified: result.matchedCount > 0 && result.modifiedCount > 0,
      inserted: result.upsertedCount > 0,
    }; // true or false
  } catch (error) {
    throw error;
  }
};

export const insertSession = async (
  newSessionObj: Session
): Promise<boolean> => {
  logQueryEvent("Inserting new session.");

  try {
    const result = await getDB().sessions.insertOne(newSessionObj);
    return result.acknowledged; // true or false
  } catch (error) {
    throw error;
  }
};

export const updateSession = async (
  newSessionObj: Session
): Promise<{ matched: boolean; modified: boolean }> => {
  logQueryEvent("Updating the session info.");

  try {
    // Destructure sessionId from newSessionObj and store the rest of the properties in sessionData
    const { _id, ...sessionData } = newSessionObj;

    const result = await getDB().sessions.updateOne(
      { _id: _id },
      { $set: sessionData }
    );

    return {
      matched: result.matchedCount > 0,
      modified: result.modifiedCount > 0,
    }; // true or false
  } catch (error) {
    throw error;
  }
};

export const deleteSession = async (sessionId: string): Promise<boolean> => {
  logQueryEvent("Deleting the session.");

  try {
    const result = await getDB().sessions.deleteOne({ _id: sessionId });
    return result.deletedCount === 1; // true or false
  } catch (error) {
    throw error;
  }
};
