import express from "express";
import { RoomStatusEnum, UserStatusEnum } from "@board-game-ito/shared";

import { getRoomInfo, addNewRoom } from "../controllers/roomController.js";
import { generateRandomRoomId } from "../utils/generateRandomId.js";
import { updateUser } from "../controllers/userController.js";

const generateUniqueRoomId = async () => {
  const startTime = Date.now();
  let roomId, room;

  // If randomly generated room ID overlaps with those in database, keep re-generating.
  do {
    // Generate random room ID
    roomId = generateRandomRoomId();
    /** @api_call - Check if room exists (GET) */
    room = await getRoomInfo(roomId);
  } while (room && Date.now() - startTime <= 5000);

  return { room, roomId };
};

const createRoomRoute = express.Router();

createRoomRoute.post("/", async (req, res) => {
  try {
    // Generate unique room ID
    const { room, roomId } = await generateUniqueRoomId();

    // If room ID generated is unique
    if (!room) {
      // Get user information
      const { user } = req.body;
      // Update user information
      user.status = UserStatusEnum.PENDING;
      /** @api_call - Update user info to database (PUT) */
      const success = await updateUser(user);

      if (success) {
        // Create a new room
        const newRoom = {
          id: roomId,
          status: RoomStatusEnum.AVAILABLE,
          creationTime: new Date(),
          createdBy: user,
          players: [user],
        };

        /** @api_call - Append new room info to database (POST) */
        const success = await addNewRoom(newRoom);

        if (success) {
          res.status(200).json({ success: true, room: newRoom });
        } else {
          res.status(200).json({ success: false });
        }
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

export default createRoomRoute;
