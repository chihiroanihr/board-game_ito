import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NODE_ENV === "production"
    ? `${window.location.hostname}:${process.env.REACT_APP_SERVER_PORT}`
    : `${process.env.REACT_APP_IP_RHINA_MACC}:${process.env.REACT_APP_SERVER_PORT}`;

const socketOptions = {
  autoConnect: false, // The autoConnect is set to false so the connection is not established right away.
  // reconnection: true,
  // reconnectionDelay: 1000,
  // reconnectionAttempts: 10,
};

export const socket: Socket = io(SOCKET_URL, socketOptions);

// Catch-all listener
if (process.env.NODE_ENV !== "production") {
  socket.onAny((event: string, ...args: any[]) => {
    console.log(event, args); // Any event received by the client will be printed in the console.
  });
}
