import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { isObjectEmpty, outputServerError } from "../utils/utils";

function CreateRoom() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCreateRoom = async () => {
    await fetch(`/create`, {
      method: "POST",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
      referrerPolicy: "no-referrer",
      body: JSON.stringify({ user }),
    })
      .then((response) => response.json())
      .then((responseData) => {
        // Response is empty -> Server error
        if (isObjectEmpty(responseData)) {
          throw new Error();
        }
        // Room ID is available
        else if (responseData.success) {
          const room = responseData.room;
          navigate("/waiting/" + room.id); // Redirect to the waiting room
        }
        // Room ID is not available
        else {
          alert(
            "This Room ID is already been used by someone else. Please re-generate different room ID."
          );
        }
      })
      // Server error
      .catch((error) => {
        outputServerError(error, "Error registering room ID");
      });
  };

  return (
    <div>
      {/** @todo - All room config settings */}
      <button onClick={handleCreateRoom}>Create Room</button>
    </div>
  );
}

export default CreateRoom;
