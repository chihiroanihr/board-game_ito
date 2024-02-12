import { useEffect } from "react";

import { useAuth } from "../hooks/useAuth";
import { useRoom } from "../hooks/useRoom";
import { useSocket } from "../hooks/useSocket";
import { outputServerError } from "../utils/utils";

function CreateRoom() {
  const { user } = useAuth();
  const { join } = useRoom();
  const { socket } = useSocket();

  const handleCreateRoom = async () => {
    // Send to socket
    socket.emit("createRoom", {
      user: user,
    });
  };

  useEffect(() => {
    async function onCreateRoomEvent(data) {
      try {
        const { success, result } = data;

        if (success) {
          await join(result.room);
        } else {
          outputServerError({ error: result });
        }
      } catch (error) {
        outputServerError({
          error: error,
          message: "Returned data is missing from the server",
        });
      }
    }

    socket.on("createRoom", onCreateRoomEvent);
    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.off("createRoom", onCreateRoomEvent);
    };
  }, [join, socket]);

  return (
    <div>
      {/** @todo - All room config settings */}
      <button onClick={handleCreateRoom}>Create Room</button>
    </div>
  );
}

export default CreateRoom;
