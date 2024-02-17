import { Server, Socket } from "socket.io";

// Keeping track of connected and logged-in sockets outside of the connection handler
const socketsConnected = new Set<string>();
const socketsLoggedIn = new Set<string>();

const addConnectedSocket = (socketId: string): void => {
  socketsConnected.add(socketId);
};

const removeConnectedSocket = (socketId: string): void => {
  socketsConnected.delete(socketId);
};

const addLoggedInSocket = (socketId: string): void => {
  socketsLoggedIn.add(socketId);
};

const removeLoggedInSocket = (socketId: string): void => {
  socketsLoggedIn.delete(socketId);
};

const initializeSocketSets = (): void => {
  socketsLoggedIn.clear();
  socketsConnected.clear();
};

const getConnectedSockets = (): Set<string> => {
  return socketsConnected;
};

const getLoggedInSockets = (): Set<string> => {
  return socketsLoggedIn;
};

const notifySocketsToAll = (io: Server): void => {
  // Emit the updated list of connected sockets
  io.emit("sockets-connected", Array.from(socketsConnected));

  // Emit the updated list of logged-in sockets
  io.emit("sockets-loggedin", Array.from(socketsLoggedIn));
};

const notifyConnectedSocket = (socket: Socket): void => {
  // Notify existing users for new connect (emit to all connected clients, except the socket itself).
  socket.broadcast.emit("socket-connected", socket.id);
};

const notifyDisconnectedSocket = (socket: Socket): void => {
  // Notify existing users for new connect (emit to all connected clients, except the socket itself).
  socket.broadcast.emit("socket-disconnected", socket.id);
};

const notifyLoggedInSocket = (socket: Socket): void => {
  // Notify existing users for new login (emit to all logged-in clients, except the socket itself).
  socket.broadcast.emit("socket-loggedin", socket.id);
};

const notifyLoggedOutSocket = (socket: Socket): void => {
  // Notify existing users for new login (emit to all logged-in clients, except the socket itself).
  socket.broadcast.emit("socket-loggedout", socket.id);
};

export {
  addConnectedSocket,
  removeConnectedSocket,
  addLoggedInSocket,
  removeLoggedInSocket,
  initializeSocketSets,
  getConnectedSockets,
  getLoggedInSockets,
  notifySocketsToAll,
  notifyConnectedSocket,
  notifyDisconnectedSocket,
  notifyLoggedInSocket,
  notifyLoggedOutSocket,
};
