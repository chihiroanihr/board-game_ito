import io from "socket.io-client";

const SOCKET_URL =
  process.env.NODE_ENV === "production"
    ? ""
    : `${process.env.REACT_APP_IP_RHINA_MACC}:${process.env.REACT_APP_SERVER_PORT}`;

export const socket = io(SOCKET_URL, {
  autoConnect: false, // The autoConnect is set to false so the connection is not established right away.
  // reconnection: true,
  // reconnectionDelay: 1000,
  // reconnectionAttempts: 10,
});

// Catch-all listener
if (process.env.NODE_ENV !== "production") {
  socket.onAny((event, ...args) => {
    console.log(event, args); // Any event received by the client will be printed in the console.
  });
}
