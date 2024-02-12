import { Server, Socket } from "socket.io";
import { ObjectId } from "mongodb";
import crypto from "crypto";

import {
  handleFindSession,
  handleSaveSession,
  handleLogin,
  handleLogout,
  handleCreateRoom,
  handleJoinRoom,
  handleLeaveRoom,
} from "./handlers/index.ts";
import {
  updateSessionConnected,
  getUserInfo,
  getRoomInfo,
} from "./controllers";

import { getDB } from "./database/dbConnect.ts";
import { User, Room } from "./interfaces/IData.ts";
/** @debug */
import { logSocketEvent } from "./utils/log.ts";

const db = getDB();

declare module "socket.io" {
  interface Socket {
    sessionId: string;
    connected: boolean;
    userId: ObjectId | null;
    roomId: string | null;
    restoredSession?: {
      user: User | null;
      room: Room | null;
    };
  }
}

function initializeSocketSession(socket: Socket): void {
  /** @socket_update */
  socket.sessionId = crypto.randomUUID();
  socket.connected = true;
  socket.userId = null;
  socket.roomId = null;
  socket.restoredSession = { user: null, room: null }; // Store session information to send to client on initial connect
}

async function checkAndRestoreSession(
  socket: Socket,
  sessionId: string
): Promise<boolean> {
  /** @db_call - Find existing session from the database */
  const session = await handleFindSession(sessionId);

  // Session found - restore session info
  if (session && typeof session === "object") {
    /** @db_call - Update session connection status */
    const { matched, modified } = await updateSessionConnected(sessionId, true);
    if (!matched && !modified) {
      throw new Error(
        "[Server Error] Failed to update session connection status (given session ID might not exist)."
      );
    }

    /** @socket_update - Restore session logic */
    socket.sessionId = session._id;
    socket.connected = true;
    socket.userId = session.user?._id ?? null;
    socket.roomId = session.room?._id ?? null;
    socket.restoredSession = { user: session.user, room: session.room };

    /** @debug */ logSocketEvent("User Session Restored", socket);
    return true;
  }

  // Session not found
  return false;
}

/** @debug */
// Keeping track of connected and logged-in sockets outside of the connection handler
const socketsConnected = new Set<string>();
const socketsLoggedIn = new Set<string>();

const socketHandler = (io: Server) => {
  // Prevent from current Socket.IO session to change every time the low-level connection between the client and the server is severed.
  io.use(async (socket: Socket, next) => {
    try {
      // Session ID (private) which will be used to authenticate the user upon reconnection
      const sessionId = socket.handshake.auth.sessionId; /** @socket_call */

      // Session ID found from the client - assign session info to socket
      if (sessionId) {
        const sessionRestored = await checkAndRestoreSession(socket, sessionId);

        // No matching session found from the server - create a new session
        if (!sessionRestored) {
          initializeSocketSession(socket);
          logSocketEvent("User Session Created", socket); /** @debug */
        }
      }

      // Session ID not found from the client - create a new session
      else {
        initializeSocketSession(socket);
        logSocketEvent("User Session Created", socket); /** @debug */
      }

      next();
    } catch (error) {
      /** @todo - Server Error */
      console.error(error.message);
      next(new Error("Internal server error")); // Pass an error to the next middleware
    }
  });

  // Handle the error, which has been forwarded through 'next()' in the middleware.
  io.on("connect_error", (error) => {
    console.error("Connection failed:", error.message);
    console.error("Error data:", error.data.content);
  });

  // The io variable can be used to do all the necessary things regarding Socket
  io.on("connection", (socket) => {
    // Socket handling logic (moved from the previous file)
    handleSocketConnection(socket, io);
    handleSocketSession(socket);
    handleSocketDisconnect(socket, io);
    handleSocketLogin(socket, io);
    handleSocketLogout(socket, io);
    handleSocketCreateRoom(socket);
    handleSocketJoinRoom(socket);
    handleSocketLeaveRoom(socket);

    /** @debug */
    console.log(`${io.engine.clientsCount} sockets connected`);
    // console.log(io.sockets.adapter.rooms);
  });
};

/** @socket_handler - Session */
const handleSocketSession = (socket: Socket) => {
  /** @socket_emit - Send session info */
  socket.emit("session", {
    sessionId: socket.sessionId,
    user: socket.restoredSession?.user,
    room: socket.restoredSession?.room,
  });
};

/** @socket_handler - Connect */
const handleSocketConnection = (socket: Socket, io: Server) => {
  /** @debug */
  // Add the socket to the set of connected sockets
  socketsConnected.add(socket.id);
  notifyConnectedSockets(socket, io);
  logSocketEvent("User Connected", socket);
};

/** @socket_handler - Disconnect */
const handleSocketDisconnect = (socket: Socket, io: Server) => {
  socket.on("disconnect", async () => {
    socket.connected = false; /** @socket_update */

    try {
      /** @db_call - Update session if user registered */
      socket.userId && (await handleSaveSession(socket));
    } catch (error) {
      console.error(error.message);
      /** @todo - Delete session or Save every user info to localstorage for emergency */
    } finally {
      // Despite error happens, you must notify to game room that player has disconnected.
      if (socket.roomId) {
        /** @db_call */
        const user = socket.userId ? await getUserInfo(socket.userId) : null;
        const room = await getRoomInfo(socket.roomId);

        /** @socket_emit - Notify others in the room */
        socket
          .to(socket.roomId)
          .emit("player-disconnected", { user: user, room: room });
      }

      /** @debug */
      // Remove the socket from both sets
      socketsConnected.delete(socket.id);
      notifyConnectedSockets(socket, io);
      logSocketEvent("User Disconnected", socket);
    }
  });
};

/** @socket_handler - Login */
const handleSocketLogin = (socket: Socket, io: Server) => {
  socket.on("login", async (userName: string) => {
    try {
      /** @db_call - Add new user */
      const newUserObj = await handleLogin(userName);

      /** @socket_update - Register new user info to socket */
      socket.userId = newUserObj._id;

      /** @socket_emit - Send back result to client */
      socket.emit("login_success", newUserObj);

      /** @debug */
      // Add the socket to the set of logged-in sockets
      socketsLoggedIn.add(socket.id);
      notifyLoggedInSockets(socket, io);
      logSocketEvent("Login", socket);
    } catch (error) {
      /** @debug */
      console.error(error.message);
      /** @todo - Emit an error message to the client in case something went wrong */
      socket.emit("login_error", error.message);
    }
  });
};

/** @socket_handler - Logout */
const handleSocketLogout = (socket: Socket, io: Server) => {
  socket.on("logout", async ({ user }) => {
    try {
      // Check if the user is connected to the socket
      if (!socket.userId) throw new Error("User is not connected.");

      // Leave room fist
      if (socket.roomId) {
        /** @db_call - Leave room */
        const updatedRoom = await handleLeaveRoom(socket.userId, socket.roomId);

        /** @socket_emit */
        // Send back result to client
        socket.emit("leave-room_success");
        // Notify others in the room
        socket
          .to(socket.roomId)
          .emit("player-left", { user: user, room: updatedRoom });

        /** @socket_update */
        // leave the user from the socket room
        socket.leave(socket.roomId);
        // Update socket info
        socket.roomId = null;
      }

      /** @db_call - Delete user */
      await handleLogout(socket.userId);

      /** @socket_update - Initialize socket information */
      socket.userId = null;
      socket.roomId = null;

      /** @socket_emit - Send back result to client */
      socket.emit("logout_success");

      /** @debug */
      // Remove the socket from loggedIn set
      socketsLoggedIn.delete(socket.id);
      notifyLoggedInSockets(socket, io);
      logSocketEvent("Logout", socket);
    } catch (error) {
      console.error(error.message);
      /** @todo - Emit an error message to the client in case something went wrong */
      socket.emit("logout_error", error.message);
    }
  });
};

/** @socket_handler - Create Room */
const handleSocketCreateRoom = (socket: Socket) => {
  socket.on("create-room", async () => {
    // Start a new session for the transaction
    const dbSession = db.startSession();

    try {
      // Check if the user is connected to the socket
      if (!socket.userId) throw new Error("User is not connected.");

      // Start a transaction session
      dbSession.startTransaction();

      /** @db_call - Create new room */
      const { user, room } = await handleCreateRoom(socket.userId, dbSession);

      // Commit the transaction
      await dbSession.commitTransaction();

      /** @socket_update */
      // Update socket info
      socket.roomId = room._id;
      // Join the user to a socket room
      socket.join(room._id);

      /** @socket_emit */
      // Send back result (user and room obj) to client
      socket.emit("create-room_success", { user, room });
      // Send message to all users currently in the room, apart from the user that just joined
      socket.to(room._id).emit("waiting-room", { user, room });

      /** @debug */
      logSocketEvent("Create Room", socket);
      logSocketEvent("Waiting Room", socket);
    } catch (error) {
      // If an error occurs, abort the transaction if it exists
      if (dbSession && dbSession.inTransaction())
        await dbSession.abortTransaction();

      console.error(error.message);
      /** @todo - Emit an error message to the client in case something went wrong */
      socket.emit("create-room_error", error.message);
    } finally {
      // End the session whether success or failure
      await dbSession.endSession();
    }
  });
};

/** @socket_handler - Join Room */
const handleSocketJoinRoom = (socket: Socket) => {
  socket.on("join-room", async ({ roomId }) => {
    // Start a new session for the transaction
    const dbSession = db.startSession();

    try {
      // Check if the user is connected to the socket
      if (!socket.userId) throw new Error("User is not connected.");

      // Start a transaction session
      dbSession.startTransaction();

      /** @db_call - Join room */
      const response = await handleJoinRoom(socket.userId, roomId, dbSession);
      if (!response)
        throw new Error(
          "[Response Error]: Response is invalid or unsuccessful."
        );

      // [1] User can join room
      if (typeof response === "object") {
        /** @socket_update */
        // Update socket info
        socket.roomId = roomId;
        // Join the user to a socket room
        socket.join(roomId);

        /** @socket_emit */
        // Send back result to client
        socket.emit("join-room_success", response);
        // Notify others in the room
        socket.to(roomId).emit("waiting-room", {
          user: response.user,
          room: response.room,
        });

        /** @debug */
        logSocketEvent("Join Room", socket);
      }

      // [2] User cannot join room
      else if (typeof response === "string") {
        // Send back result to client
        socket.emit("join-room_failure", response);
      }

      // Response error
      else {
        throw new Error(
          "[Response Error]: Response is invalid or unsuccessful."
        );
      }

      // Commit the transaction
      await dbSession.commitTransaction();
    } catch (error) {
      // If an error occurs, abort the transaction if it exists
      if (dbSession && dbSession.inTransaction())
        await dbSession.abortTransaction();

      console.error(error.message);
      /** @todo - Emit an error message to the client in case something went wrong */
      socket.emit("join-room_error", error.message);
    } finally {
      // End the session whether success or failure
      if (dbSession) await dbSession.endSession();
    }
  });
};

/** @socket_handler - Leave Room */
const handleSocketLeaveRoom = (socket: Socket) => {
  socket.on("leave-room", async ({ user, room }) => {
    try {
      // Check if the user and room is connected to the socket
      if (!socket.userId) throw new Error("User is not connected.");
      if (!socket.roomId) throw new Error("Room is not connected.");

      const updatedRoom = await handleLeaveRoom(socket.userId, socket.roomId); // room obj or null if room deleted

      /** @socket_emit */
      // Send back result to client
      socket.emit("leave-room_success");
      // Notify others in the room
      socket
        .to(socket.roomId)
        .emit("player-left", { user: user, room: updatedRoom });

      /** @socket_update */
      // leave the user from the socket room
      socket.leave(socket.roomId);
      // Update socket info
      socket.roomId = null;

      /** @debug */
      logSocketEvent("Leave Room", socket);
    } catch (error) {
      console.error(error.message);
      /** @todo - Emit an error message to the client in case something went wrong */
      socket.emit("leave-room_error", error.message);
    }
  });
};

/** @debug */
function notifyConnectedSockets(socket: Socket, io: Server) {
  if (process.env.NODE_ENV !== "production") {
    // Notify existing users for new connect (emit to all connected clients, except the socket itself).
    socket.broadcast.emit("socket-connected", {
      socketId: socket.id,
    });
    // Emit the updated list of connected sockets
    io.emit("sockets-connected", Array.from(socketsConnected));
  }
}

/** @debug */
function notifyLoggedInSockets(socket: Socket, io: Server) {
  if (process.env.NODE_ENV !== "production") {
    // Notify existing users for new login (emit to all logged-in clients, except the socket itself).
    socket.broadcast.emit("socket-loggedin", {
      socketId: socket.id,
    });
    // Emit the updated list of logged-in sockets
    io.emit("sockets-loggedin", Array.from(socketsLoggedIn));
  }
}

export default socketHandler;
