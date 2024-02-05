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

const handleCreateRoom = async (user) => {
  try {
    // Generate unique room ID
    const { room, roomId } = await generateUniqueRoomId();

    // If room ID generated is unique
    if (!room) {
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
          return { success: true, result: { user: user, room: newRoom } };
        } else {
          return {
            success: false,
            result: "[DB Error]: Failed to add new room.",
          };
        }
      } else {
        return {
          success: false,
          result: "[DB Error]: Failed to update user's status.",
        };
      }
    }
    // If room ID keeps overlapping with those in database
    else {
      return {
        success: false,
        result: "[DB Error]: Room ID overlaps.",
      };
    }
  } catch (error) {
    return {
      success: false,
      result: "[Server Error]: " + error,
    };
  }
};

export default handleCreateRoom;
