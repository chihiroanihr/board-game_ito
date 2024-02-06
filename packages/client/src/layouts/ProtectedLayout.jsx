import { useEffect } from "react";
import { useNavigate, useOutlet } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useRoom } from "../hooks/useRoom";
import { useSocket } from "../hooks/useSocket";
import { outputServerError } from "../utils/utils";

export default function ProtectedLayout() {
  const navigate = useNavigate();
  const outlet = useOutlet();

  const { user, logout } = useAuth();
  const { room, leave } = useRoom();
  const { socket } = useSocket();

  // Check local storage change
  useEffect(() => {
    if (!user) {
      navigate("/");
    }

    const checkLocalStorage = () => {
      const storedUser = window.localStorage.getItem("user");
      const storedRoom = window.localStorage.getItem("room");

      if (!storedUser || !user) {
        leave(); // leave room
        logout(); // then logout
      } else if (!storedRoom || !room) {
        navigate("/dashboard");
      }
    };

    window.addEventListener("storage", checkLocalStorage);
    return () => window.removeEventListener("storage", checkLocalStorage);
  }, [user, room, navigate, logout, leave]);

  /** @function - Handle logout */
  const handleLogout = () => {
    // Send to socket
    socket.emit("logout", {
      user: user,
      room: room,
      socketId: socket.id,
    });
    // logout();
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

    // Cleanup the socket event listener when the component unmounts
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
      socketId: socket.id,
    });
    // leave();
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

    // Cleanup the socket event listener when the component unmounts
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
