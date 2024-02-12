import { ClientSession, ObjectId, ReturnDocument } from "mongodb";
import { UserStatusEnum } from "@board-game-ito/shared";

import { getDB } from "../database/dbConnect";
import { User } from "../interfaces/IData";
import { logQueryEvent } from "../utils/log";

export const getUserInfo = async (userId: ObjectId): Promise<User | null> => {
  logQueryEvent("Fetching the user info.");

  try {
    return await getDB().users.findOne({ _id: userId }); // user object or null (not found)
  } catch (error) {
    // This catch block would only be executed if there was an actual error during the query,
    // such as a database connection issue, rather than simply no matching document being found.
    throw error;
  }
};

export const insertUser = async (newUserObj: User): Promise<boolean> => {
  logQueryEvent("Inserting new user.");

  try {
    const result = await getDB().users.insertOne(newUserObj);
    return result.acknowledged; // true or false
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (
  newUserObj: User
): Promise<{ matched: boolean; modified: boolean }> => {
  logQueryEvent("Updating the user.");

  try {
    // Destructure userId from newUserObj and store the rest of the properties in userData
    const { _id, ...userData } = newUserObj;

    const result = await getDB().users.updateOne(
      { _id: _id },
      { $set: userData }
    );

    return {
      matched: result.matchedCount > 0,
      modified: result.modifiedCount > 0,
    }; // true or false
  } catch (error) {
    throw error;
  }
};

export const updateUserStatus = async (
  userId: ObjectId,
  newStatus: UserStatusEnum,
  dbSession: ClientSession | null = null
): Promise<User | null> => {
  logQueryEvent("Updating only the user status.");

  try {
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

    // result will contain the updated or original (if no modification) document,
    // or null if no document was found.
    return await getDB().users.findOneAndUpdate(
      { _id: userId }, // Query part: find a user with this _id
      { $set: { status: newStatus } }, // Update part: set the new status
      options
    );

    // const updateOptions = dbSession ? { session: dbSession } : {};

    // const result = await getDB().users.updateOne(
    //   { _id: userId }, // Query part: find a user with this _id
    //   { $set: { status: newStatus } }, // Update part: set the new status
    //   updateOptions
    // );

    // return {
    //   matched: result.matchedCount > 0,
    //   modified: result.modifiedCount > 0,
    // }; // true or false
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async (userId: ObjectId): Promise<boolean> => {
  logQueryEvent("Deleting the user.");

  try {
    const result = await getDB().users.deleteOne({ _id: userId });
    return result.deletedCount === 1; // true or false
  } catch (error) {
    throw error;
  }
};

export const getAllUsers = async (): Promise<Array<User>> => {
  logQueryEvent("Fetching all users.");

  try {
    return await getDB().users.find({}).toArray(); // Array with elements or empty array
  } catch (error) {
    throw error;
  }
};

export const deleteAllUsers = async (): Promise<boolean> => {
  logQueryEvent("Deleting all users.");

  try {
    const result = await getDB().users.deleteMany({});
    return result.deletedCount > 0; // true or false
  } catch (error) {
    throw error;
  }
};
