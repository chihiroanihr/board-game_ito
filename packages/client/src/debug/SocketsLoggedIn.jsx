import { useEffect, useState } from "react";

import { useSocket } from "../hooks/useSocket";

const SocketsLoggedIn = () => {
  const { socket } = useSocket();

  const [socketsLoggedIn, setSocketsLoggedIn] = useState([]);
  const [socketLoggedIn, setSocketLoggedIn] = useState();

  useEffect(() => {
    async function onSocketsUpdateEvent(data) {
      setSocketsLoggedIn(data);
    }

    socket.on("socketsLoggedIn", onSocketsUpdateEvent);
    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.off("socketsLoggedIn", onSocketsUpdateEvent);
    };
  }, [socket]);

  useEffect(() => {
    async function onNewSocketEvent(data) {
      setSocketLoggedIn(data);
      setSocketsLoggedIn((prevState) => [...prevState, data]);
    }

    socket.on("socketLoggedIn", onNewSocketEvent);
    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.off("socketLoggedIn", onNewSocketEvent);
    };
  }, [socket]);

  return (
    <div>
      <h2>Users Currently Logged in</h2>

      <div>
        {socketsLoggedIn && (
          <ul>
            {socketsLoggedIn.map((user) => (
              <li key={user.socketId}>{user.socketId}</li>
            ))}
          </ul>
        )}

        {socketLoggedIn && <p>{socketLoggedIn.socketId} just logged in.</p>}
      </div>
    </div>
  );
};

export default SocketsLoggedIn;
