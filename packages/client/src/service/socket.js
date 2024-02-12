import io from "socket.io-client";

const SOCKET_URL = "192.168.1.150:3001";

export const socket = io(SOCKET_URL, { autoConnect: false }); // The autoConnect is set to false so the connection is not established right away.

// Catch-all listener
if (process.env.NODE_ENV !== "production") {
  socket.onAny((event, ...args) => {
    console.log(event, args); // Any event received by the client will be printed in the console.
  });
}
