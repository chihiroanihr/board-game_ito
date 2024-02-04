import { UserStatusEnum } from "@board-game-ito/shared";

import { getUserInfo, addNewUser } from "../controllers/userController.js";
import { generateRandomUserId } from "../utils/generateRandomId.js";

const generateUniqueUserId = async () => {
  const startTime = Date.now();
  let user, userId;

  // If randomly generated user ID overlaps with those in database, keep re-generating.
  do {
    // Generate random user ID
    userId = generateRandomUserId();

    /** @api_call - Check if identical user exists (GET) */
    user = await getUserInfo(userId);
  } while (user && Date.now() - startTime <= 5000);

  return { user, userId };
};

const handleLogin = async (userName) => {
  try {
    // Generate unique user ID
    const { user, userId } = await generateUniqueUserId();

    // If user ID generated is unique
    if (!user) {
      // Create a new user
      const newUser = {
        id: userId,
        name: userName,
        status: UserStatusEnum.IDLE,
        creationTime: new Date(),
      };

      /** @api_call - Append new user info to database (POST) */
      const success = await addNewUser(newUser);

      if (success) {
        return { success: true, response: { user: newUser } };
      } else {
        return {
          success: false,
          response: "[DB Error]: Failed to add new user.",
        };
      }
    }
    // If user ID keeps overlapping with those in database
    else {
      return {
        success: false,
        response: "[DB Error]: User ID overlaps.",
      };
    }
  } catch (error) {
    return {
      success: false,
      response: "[Server Error]: " + error,
    };
  }
};

export default handleLogin;
