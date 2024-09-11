import { ClientSession, ObjectId, ReturnDocument } from 'mongodb';

import type { User, UserStatusEnum } from '@bgi/shared';

import { getDB } from '../dbConnect';
import { logQueryEvent } from '../../log';

export const getUserInfo = async (userId: ObjectId): Promise<User | null> => {
  logQueryEvent('Fetching the user info.');

  return await getDB().users.findOne({ _id: userId }); // user object or null (not found)
};

export const insertUser = async (
  newUserObj: User,
  dbSession: ClientSession | null = null
): Promise<boolean> => {
  logQueryEvent('Inserting new user.');

  const result = await getDB().users.insertOne(
    newUserObj, // Insert
    dbSession ? { session: dbSession } : {} // Option
  );
  return result.acknowledged; // true or false
};

export const updateUser = async (
  newUserObj: User
): Promise<{ matched: boolean; modified: boolean }> => {
  logQueryEvent('Updating the user.');

  // Destructure userId from newUserObj and store the rest of the properties in userData
  const { _id, ...userData } = newUserObj;

  const result = await getDB().users.updateOne({ _id: _id }, { $set: userData });

  return {
    matched: result.matchedCount > 0,
    modified: result.modifiedCount > 0,
  }; // true or false
};

export const updateUserStatus = async (
  userId: ObjectId,
  newStatus: UserStatusEnum,
  dbSession: ClientSession | null = null
): Promise<User | null> => {
  logQueryEvent('Updating only the user status in User.');

  // Result will contain the updated or original (if no modification) document, or null if no document was found.
  return await getDB().users.findOneAndUpdate(
    // Filter
    { _id: userId }, // find a user with this _id
    // Update
    { $set: { status: newStatus } }, // set the new status
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

export const updateGivenUsersStatus = async (
  userIds: Array<ObjectId>,
  newStatus: UserStatusEnum,
  dbSession: ClientSession | null = null
): Promise<boolean> => {
  logQueryEvent('Updating the user status for given array of users.');

  // Update status for all users in the room
  const result = await getDB().users.updateMany(
    // Filter
    { _id: { $in: userIds } },
    // Update
    { $set: { status: newStatus } },
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

export const deleteUser = async (
  userId: ObjectId,
  dbSession: ClientSession | null = null
): Promise<boolean> => {
  logQueryEvent('Deleting the user.');

  const result = await getDB().users.deleteOne(
    // Filter
    { _id: userId },
    // Option
    dbSession ? { session: dbSession } : {}
  );

  return result.deletedCount === 1; // true or false
};

export const getAllUsers = async (): Promise<Array<User>> => {
  logQueryEvent('Fetching all users.');

  return await getDB().users.find({}).toArray(); // Array with elements or empty array
};

export const deleteAllUsers = async (): Promise<boolean> => {
  logQueryEvent('Deleting all users.');

  const result = await getDB().users.deleteMany({});
  return result.deletedCount > 0; // true or false
};
