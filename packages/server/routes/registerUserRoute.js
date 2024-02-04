import express from "express";
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

const registerUserRoute = express.Router();

registerUserRoute.post("/", async (req, res) => {
  try {
    const { userName } = req.params;

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
        res.status(200).json({ success: true, user: newUser });
      } else {
        res.status(200).json({ success: false });
      }
    }
    // If room ID keeps overlapping with those in database
    else {
      res.status(200).json({ success: false });
    }
  } catch (error) {
    console.log("[Error]: ", error);
    res.status(500).send(error);
  }
});

export default registerUserRoute;
