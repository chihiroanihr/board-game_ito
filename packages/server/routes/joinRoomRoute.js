import express from "express";
import { RoomStatusEnum } from "@board-game-ito/shared";

import { getRoomInfo } from "../controllers/roomController.js";

const joinRoomRoute = express.Router();

joinRoomRoute.get("/:roomId", async (req, res) => {
  try {
    // Obtain parameters from the client
    const { roomId } = req.params;

    /** @api_call - Obtain room info from the database (GET) */
    const room = await getRoomInfo(roomId);

    // If room does not exist
    if (!room) {
      res.status(200).json({ roomId: roomId, roomStatus: RoomStatusEnum.VOID });
    }
    //  If room exists
    else {
      const { id, status } = room;
      res.status(200).json({ roomId: id, roomStatus: status });
    }
  } catch (error) {
    console.log("[Error]: ", error);
    res.status(500).send(error);
  }
});

export default joinRoomRoute;
