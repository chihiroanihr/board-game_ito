import { RoomStatusEnum } from "@board-game-ito/shared";

import { getRoomInfo } from "../controllers/roomController.js";
import { addPlayerInRoom } from "../controllers/playerController.js";

const handleJoinRoom = async ({ user, roomId }) => {
  try {
    /** @api_call - Obtain room info from the database (GET) */
    const room = await getRoomInfo(roomId);

    // If room does not exist
    if (!room) {
      return {
        success: false,
        response: "[DB Error]: This room does not exist.",
      };
    }
    //  If room exists but playing
    else if (room.status === RoomStatusEnum.PLAYING) {
      return {
        success: false,
        response: "[DB Error]: This room is currently playing.",
      };
    }
    //  If room exists but full
    else if (room.status === RoomStatusEnum.FULL) {
      return {
        success: false,
        response: "[DB Error]: This room is full of players.",
      };
    }
    // If room exists and not full
    else {
      // Update user information
      user.status = UserStatusEnum.PENDING;
      /** @api_call - Update user info (PUT) */
      const success = await updateUser(user);

      if (success) {
        /** @api_call - Add user to room (PUT) */
        const success = await addPlayerInRoom({ user, roomId });

        if (success) {
          return { success: true, response: { user: user, room: room } };
        } else {
          return {
            success: false,
            response: "[DB Error]: Failed to add user to the room.",
          };
        }
      } else {
        return {
          success: false,
          response: "[DB Error]: Failed to update user's status.",
        };
      }
    }
  } catch (error) {
    return {
      success: false,
      response: "[Server Error]: " + error,
    };
  }
};

export default handleJoinRoom;
