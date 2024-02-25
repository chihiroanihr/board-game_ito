import { ClientSession, ObjectId } from 'mongodb';

import { User, UserStatusEnum } from '@bgi/shared';

import * as controller from '@/controllers';
import * as debug from '@/debug';

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
      creationTime: new Date()
    };

    /** @api_call - Append new user info to database (POST) */
    const success = await controller.insertUser(newUserObj, dbSession);
    // Error
    if (!success) {
      throw new Error('Failed to insert new user (there might be duplicates in the database).');
    }

    // All success
    return newUserObj;
  } catch (error) {
    throw debug.handleDBError(error, 'handleLogin');
  }
};

export const handleLogout = async (
  userId: ObjectId,
  dbSession: ClientSession | null = null
): Promise<void> => {
  // [!] Assume room ID is already set to null by the previous handleLeave() operation.

  try {
    /** @api_call - Delete the user (DELETE) */
    const success = await controller.deleteUser(userId, dbSession);
    // Error
    if (!success) {
      throw new Error('Failed to delete the user (given user might not exist).');
    }

    // All success
    return;
  } catch (error) {
    throw debug.handleDBError(error, 'handleLogout');
  }
};
