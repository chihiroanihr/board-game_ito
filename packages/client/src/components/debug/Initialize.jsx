import { useState } from "react";

import { useSocket } from "../../hooks/useSocket";
import {
  outputServerError,
  isObjectEmpty,
  outputResponseTimeoutError,
} from "../../utils";

export default function Initialize() {
  const { socket } = useSocket();

  const [loading, setLoading] = useState(false);

  const initializeHandler = async () => {
    setLoading(true);

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      setLoading(false);
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit("initialize", async (error, response) => {
      // socket.emit("initialize");

      // Clear the timeout as response is received before timeout
      clearTimeout(timeoutId);

      const { rooms, users, sessions } = response;

      if (error) {
        outputServerError({ error });
      } else {
        if (
          (rooms || !isObjectEmpty(rooms)) &&
          (users || !isObjectEmpty(users)) &&
          (sessions || isObjectEmpty(sessions))
        ) {
          alert("[Success]: Successfully initialized Mongo DB.");
        } else {
          alert("[Error]: Could not initialize database.");
        }
      }

      setLoading(false); // Set loading to false when the response is received
    });
  };

  return (
    <button onClick={initializeHandler} disabled={loading}>
      {loading ? "Loading..." : "Initialize Data"}
    </button>
  );
}
