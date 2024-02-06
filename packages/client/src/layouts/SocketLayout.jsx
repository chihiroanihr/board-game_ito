import { useEffect } from "react";
import { useOutlet } from "react-router-dom";

import { SocketProvider } from "../hooks/useSocket";
import { socket } from "../service/socket";

export default function SocketLayout() {
  const outlet = useOutlet();

  useEffect(() => {
    // no-op if the socket is already connected
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  return <SocketProvider socket={socket}>{outlet}</SocketProvider>;
}
