import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import { outputServerError } from "../utils/utils";

function CreateRoom() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const handleCreateRoom = async () => {
    // Send to socket
    socket.emit("createRoom", {
      user: user,
      socketId: socket.id,
    });
  };

  useEffect(() => {
    socket.on("roomCreated", async (data) => {
      try {
        const { success, response } = data;
        if (success) {
          const { room } = response;
          navigate("/waiting/" + room.id); // Redirect to the waiting room
        } else {
          outputServerError({ error: response });
        }
      } catch (error) {
        outputServerError({
          error: error,
          message: "Returned data is missing from the server",
        });
      }
    });
  }, [socket]);

  return (
    <div>
      {/** @todo - All room config settings */}
      <button onClick={handleCreateRoom}>Create Room</button>
    </div>
  );
}

export default CreateRoom;
