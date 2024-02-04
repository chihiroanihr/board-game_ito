import { useEffect } from "react";
import { useNavigate, useOutlet } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";

export default function ProtectedLayout() {
  const navigate = useNavigate();
  const outlet = useOutlet();
  const { user, logout } = useAuth();
  const { socket } = useSocket();

  // If user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user]);

  const handleLeave = () => {
    // Send to socket
    socket.emit("logout", {
      user: user,
      socketId: socket.id,
    });
    logout();
  };

  return (
    <div>
      <header>{/* Navigation */}</header>

      <main>
        <div>
          <h2>Hello, {user.name}</h2>
          {/* <Link to="/config">Game Configuration</Link> */}
          <button onClick={handleLeave}>Leave</button>
        </div>

        <div>{outlet}</div>
      </main>

      <footer></footer>
    </div>
  );
}
