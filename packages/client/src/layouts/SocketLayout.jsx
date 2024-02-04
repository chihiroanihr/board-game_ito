import React from "react";
import socketIO from "socket.io-client";
import { useOutlet } from "react-router-dom";

import { SocketProvider } from "../hooks/useSocket";

const socket = socketIO.connect("http://localhost:3001");

export default function SocketLayout() {
  const outlet = useOutlet();

  return <SocketProvider socket={socket}>{outlet}</SocketProvider>;
}
