import { useState } from "react";

import { useAuth } from "../hooks/useAuth";
import { useRoom } from "../hooks/useRoom";
import { useSocket } from "../hooks/useSocket";
import { outputServerError, outputResponseTimeoutError } from "../utils";

/**
 * Subpage for Dashboard
 * @returns
 */
function CreateRoom() {
  const { updateUser } = useAuth();
  const { joinRoom } = useRoom();
  const { socket } = useSocket();

  const [loading, setLoading] = useState(false);

  const handleCreateRoom = () => {
    setLoading(true);

    // Send to socket
    socket.emit("create-room", async (error, response) => {
      // socket.emit("create-room", user);

      // Clear the timeout as response is received before timeout
      clearTimeout(
        // Create a timeout to check if the response is received
        setTimeout(() => {
          setLoading(false);
          outputResponseTimeoutError();
        }, 5000)
      );

      const { user, room } = response;

      if (error) {
        outputServerError({ error });
      } else {
        updateUser(user); // Store updated user info to local storage
        joinRoom(room); // Store room info to local storage and redirect
      }

      setLoading(false);
    });
  };

  // useEffect(() => {
  //   async function onCreateRoomSuccessEvent(data) {
  //     try {
  //       const { user, room } = data;

  //       if (user && room) {
  //         joinRoom(room);
  //       } else {
  //         throw new Error("Returned data is missing from the server.");
  //       }
  //     } catch (error) {
  //       outputServerError({ error });
  //     }
  //   }

  //   socket.on("create-room_success", onCreateRoomSuccessEvent);

  //   return () => {
  //     socket.off("create-room_success", onCreateRoomSuccessEvent);
  //   };
  // }, [joinRoom, socket]);

  // useEffect(() => {
  //   async function onCreateRoomErrorEvent(error) {
  //     outputServerError({ error });
  //   }

  //   socket.on("create-room_error", onCreateRoomErrorEvent);

  //   return () => {
  //     socket.off("create-room_error", onCreateRoomErrorEvent);
  //   };
  // }, [joinRoom, socket]);

  return (
    <div>
      {/** @todo - All room config settings */}
      <button onClick={handleCreateRoom} disabled={loading}>
        {loading ? "Loading..." : "Create Room"}
      </button>
    </div>
  );
}

export default CreateRoom;
