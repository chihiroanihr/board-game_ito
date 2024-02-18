import { useState } from "react";
import { useOutlet } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useRoom } from "../hooks/useRoom";
import { useSocket } from "../hooks/useSocket";
import { outputServerError, outputResponseTimeoutError } from "../utils";

/**
 * Layout for Dashboard
 * @returns
 */
export default function DashboardLayout() {
  const outlet = useOutlet();

  const { user, logout } = useAuth();
  const { room, leaveRoom, updateRoom } = useRoom();
  const { socket } = useSocket();

  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    setLoading(true); // Set loading to true when the request is initiated

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      setLoading(false);
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit("logout", user, async (error, response) => {
      // socket.emit("logout", user);

      // Clear the timeout as response is received before timeout
      clearTimeout(timeoutId);

      if (error) {
        outputServerError({ error });
      } else {
        updateRoom(null);
        logout();
      }

      setLoading(false); // Set loading to false when the response is received
    });
  };

  // useEffect(() => {
  //   function onLogoutSuccessEvent(data) {
  //     try {
  //       logout();
  //     } catch (error) {
  //       outputServerError({ error });
  //     }
  //   }

  //   socket.on("logout_success", onLogoutSuccessEvent);

  //   return () => {
  //     socket.off("logout_success", onLogoutSuccessEvent);
  //   };
  // }, [logout, socket]);

  // useEffect(() => {
  //   function onLogoutErrorEvent(error) {
  //     outputServerError({ error });
  //   }

  //   socket.on("logout_error", onLogoutErrorEvent);

  //   return () => {
  //     socket.off("logout_error", onLogoutErrorEvent);
  //   };
  // });

  const handleLeaveRoom = () => {
    setLoading(true); // Set loading to true when the request is initiated

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      setLoading(false);
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit("leave-room", user, async (error, response) => {
      // socket.emit("leave-room", user);

      // Clear the timeout as response is received before timeout
      clearTimeout(timeoutId);

      if (error) {
        outputServerError({ error });
      } else {
        leaveRoom();
      }

      setLoading(false); // Set loading to false when the response is received
    });
  };

  // const handleLeaveRoom = () => {
  //   // Send to socket
  //   socket.emit("leave-room", user);
  // };

  // useEffect(() => {
  //   async function onLeaveRoomSuccessEvent(data) {
  //     try {
  //       leaveRoom();
  //     } catch (error) {
  //       outputServerError({ error });
  //     }
  //   }

  //   socket.on("leave-room_success", onLeaveRoomSuccessEvent);

  //   return () => {
  //     socket.off("leave-room_success", onLeaveRoomSuccessEvent);
  //   };
  // }, [leaveRoom, socket]);

  // useEffect(() => {
  //   async function onLeaveRoomErrorEvent(error) {
  //     outputServerError({ error });
  //   }

  //   socket.on("leave-room_error", onLeaveRoomErrorEvent);

  //   return () => {
  //     socket.off("leave-room_error", onLeaveRoomErrorEvent);
  //   };
  // }, [leaveRoom, socket]);

  if (!user) return null;
  return (
    <>
      <div>
        <h2>Hello, {user.name}</h2>

        <button onClick={handleLogout} disabled={loading}>
          {loading ? "Loading..." : "Leave Game"}
        </button>

        {room && (
          <button onClick={handleLeaveRoom} disabled={loading}>
            {loading ? "Loading..." : "Leave Room"}
          </button>
        )}
      </div>

      <div>{outlet}</div>
    </>
  );
}
