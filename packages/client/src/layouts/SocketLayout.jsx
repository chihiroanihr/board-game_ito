import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useOutlet } from "react-router-dom";

import { SocketProvider } from "../hooks/useSocket";

const socket = io("192.168.1.150:3001");

export default function SocketLayout() {
  const outlet = useOutlet();

  useEffect(() => {
    // no-op if the socket is already connected
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  const [output, setOutput] = useState("");

  // Send
  const handleSendMessage = () => {
    socket.emit("message", `message sent from ${socket.id}`);
  };

  // Receive
  useEffect(() => {
    async function onMessageOutput(data) {
      setOutput(data);
    }
    socket.on("message", onMessageOutput);
    return () => {
      socket.off("message", onMessageOutput);
    };
  }, []);

  return (
    <SocketProvider socket={socket}>
      {outlet}
      <button onClick={handleSendMessage}>Message</button>
      <p>{output}</p>
    </SocketProvider>
  );
}
