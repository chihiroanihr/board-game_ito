import { deleteRoom } from "../controllers/roomController.js";
import { deletePlayerFromRoom } from "../controllers/playerController.js";

const handleLeaveRoom = async (user, room) => {
  try {
    // If user is a room admin
    if (room.createdBy.id === user.id) {
      /** @api_call - Delete room by room ID (DELETE) */
      const success = await deleteRoom(room.id);

      if (success) {
        return { success: true, result: { user: user, room: room } };
      } else {
        return {
          success: false,
          result: "[DB Error]: Failed to remove user from the room.",
        };
      }
    }
    // If user is a room participant
    else {
      /** @api_call - Delete user from room (DELETE) */
      const success = await deletePlayerFromRoom(user, room);

      if (success) {
        return { success: true, result: { user: user, room: room } };
      } else {
        return {
          success: false,
          result: "[DB Error]: Failed to remove user from the room.",
        };
      }
    }
  } catch (error) {
    return {
      success: false,
      result: "[Server Error]: " + error,
    };
  }
};

export default handleLeaveRoom;
