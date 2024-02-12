import { useEffect, useState } from "react";

import { useSocket } from "../hooks/useSocket";

const SocketsConnected = () => {
  const { socket } = useSocket();

  const [socketsConnected, setSocketsConnected] = useState([]);
  const [socketConnected, setSocketConnected] = useState();

  useEffect(() => {
    async function onSocketsUpdateEvent(data) {
      setSocketsConnected(data);
    }

    socket.on("socketsConnected", onSocketsUpdateEvent);
    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.off("socketsConnected", onSocketsUpdateEvent);
    };
  }, [socket]);

  useEffect(() => {
    async function onNewSocketEvent(data) {
      setSocketConnected(data);
      setSocketsConnected((prevState) => [...prevState, data]);
    }

    socket.on("socketConnected", onNewSocketEvent);
    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.off("socketConnected", onNewSocketEvent);
    };
  }, [socket]);

  return (
    <div>
      <h2>Users Currently Connected</h2>

      <div>
        {socketsConnected && (
          <ul>
            {socketsConnected.map((user) => (
              <li key={user.socketId}>{user.socketId}</li>
            ))}
          </ul>
        )}

        {socketConnected && <p>{socketConnected.socketId} just connected.</p>}
      </div>
    </div>
  );
};

export default SocketsConnected;
