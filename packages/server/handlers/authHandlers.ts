import { ObjectId } from "mongodb";
import { UserStatusEnum } from "@board-game-ito/shared";

import { insertUser, deleteUser } from "../controllers/index.ts";

import { User } from "../interfaces/IData.ts";

export const handleLogin = async (userName: string): Promise<User> => {
  try {
    // Create a new user
    const newUserObj: User = {
      _id: new ObjectId(), // Unique user ID
      name: userName,
      status: UserStatusEnum.IDLE,
      creationTime: new Date(),
    };

    /** @api_call - Append new user info to database (POST) */
    const success = await insertUser(newUserObj);
    if (!success) {
      throw new Error(
        "Failed to insert new user (there might be duplicates in the database)."
      );
    }

    // All success
    return newUserObj;
  } catch (error) {
    throw new Error(
      `[Server Error]: Failed to login.\n
      ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const handleLogout = async (userId: ObjectId): Promise<void> => {
  try {
    /** @api_call - Delete the user (DELETE) */
    if (!(await deleteUser(userId))) {
      throw new Error(
        "Failed to delete the user (given user might not exist)."
      );
    }

    // All success
    return;
  } catch (error) {
    throw new Error(
      `[Server Error]: Failed to handle logout.\n
      ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
