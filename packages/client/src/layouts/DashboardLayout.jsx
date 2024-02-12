import { useEffect } from "react";
import { useOutlet, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useRoom } from "../hooks/useRoom";
import { useSocket } from "../hooks/useSocket";
import { outputServerError } from "../utils/utils";

export default function DashboardLayout() {
  const outlet = useOutlet();
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const { room, leave } = useRoom();
  const { socket } = useSocket();

  // Check user log in status
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [navigate, user]);

  /** @function - Handle logout */
  const handleLogout = () => {
    // Send to socket
    socket.emit("logout", {
      user: user,
      room: room,
    });
  };

  useEffect(() => {
    async function onLogoutEvent(data) {
      try {
        const { success, result } = data;

        if (success) {
          await logout();
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

    socket.on("logout", onLogoutEvent);

    return () => {
      socket.off("logout", onLogoutEvent);
    };
  }, [logout, socket]);

  /** @function - Handle leave room */
  const handleLeaveRoom = () => {
    // Send to socket
    socket.emit("leaveRoom", {
      user: user,
      room: room,
    });
  };

  useEffect(() => {
    async function onLeaveEvent(data) {
      try {
        const { success, result } = data;

        if (success) {
          await leave();
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

    socket.on("leaveRoom", onLeaveEvent);

    return () => {
      socket.off("leaveRoom", onLeaveEvent);
    };
  }, [leave, socket]);

  return (
    user && (
      <div>
        <header>{/* Navigation */}</header>

        <main>
          <div>
            <h2>Hello, {user.name}</h2>
            {/* <Link to="/config">Game Configuration</Link> */}
            <button onClick={handleLogout}>Leave Game</button>
            {room && <button onClick={handleLeaveRoom}>Leave Room</button>}
          </div>

          <div>{outlet}</div>
        </main>

        <footer></footer>
      </div>
    )
  );
}
