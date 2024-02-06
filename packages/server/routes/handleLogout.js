import { deleteUser } from "../controllers/userController.js";
import { deleteRoom } from "../controllers/roomController.js";
import { deletePlayerFromRoom } from "../controllers/playerController.js";

const handleLogout = async (user, room) => {
  try {
    // If user is in room
    if (room) {
      // If user is an admin of the room
      /** @api_call - Delete a room itself if user is room admin (DELETE) */
      if (user.id === room.createdBy.id) {
        const success = await deleteRoom(room.id);

        if (!success) {
          return {
            success: false,
            result: "[DB Error]: Failed to remove user from the room.",
          };
        }
      } else {
        // If user is a participant of the room
        /** @api_call - Delete user from the room (DELETE) */
        const success = await deletePlayerFromRoom(user, room);

        if (!success) {
          return {
            success: false,
            result: "[DB Error]: Failed to remove user from the room.",
          };
        }
      }
    }

    // Finally, delete the user
    /** @api_call - Delete a user from database (DELETE) */
    const success = await deleteUser(user.id);

    if (success) {
      return { success: true, result: { user: user, room: room } };
    } else {
      return {
        success: false,
        result: "[DB Error]: Failed to delete a user.",
      };
    }
  } catch (error) {
    return {
      success: false,
      result: "[Server Error]: " + error,
    };
  }
};

export default handleLogout;
