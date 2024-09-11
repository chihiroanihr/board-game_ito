import { ClientSession, ObjectId } from 'mongodb';

import { type User, UserStatusEnum } from '@bgi/shared';

import * as controller from '../controllers';
import * as log from '../../log';

export const handleLogin = async (
  userName: string,
  dbSession: ClientSession | null = null
): Promise<User> => {
  try {
    // Create a new user
    const newUserObj: User = {
      _id: new ObjectId(), // Unique user ID
      name: userName,
      status: UserStatusEnum.IDLE,
      creationTime: new Date(),
    };

    /** @api_call - Append new user info to database (POST) */
    if (!(await controller.insertUser(newUserObj, dbSession)))
      // ERROR
      throw new Error('Failed to insert new user (there might be duplicates in the database).');

    // All success
    return newUserObj;
  } catch (error) {
    throw log.handleDBError(error, 'handleLogin');
  }
};

export const handleLogout = async (
  userId: ObjectId,
  dbSession: ClientSession | null = null
): Promise<void> => {
  // [!] Assume room ID is already set to null by the previous handleLeave() operation.

  try {
    /** @api_call - Delete the user (DELETE) */
    if (!(await controller.deleteUser(userId, dbSession)))
      // Error
      throw new Error('Failed to delete the user (given user might not exist).');

    // All success
    return;
  } catch (error) {
    throw log.handleDBError(error, 'handleLogout');
  }
};
