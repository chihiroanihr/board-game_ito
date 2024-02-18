import crypto from "crypto";
import { Server, Socket } from "socket.io";
import { ObjectId } from "mongodb";

import { User, Room } from "@board-game-ito/shared";

import { getDB } from "../database/dbConnect";

import {
  handleFindSession,
  handleSaveSession,
  handleLogin,
  handleLogout,
  handleCreateRoom,
  handleJoinRoom,
  handleLeaveRoom,
} from "@handler";

import {
  updateSessionConnected,
  getUserInfo,
  getRoomInfo,
  convertPlayerIdsToPlayerObjs,
  deleteAllRooms,
  deleteAllUsers,
  deleteAllSessions,
} from "@controller";

/** @debug */
import {
  logSocketEvent,
  handleServerError,
  handleDBError,
  addConnectedSocket,
  removeConnectedSocket,
  addLoggedInSocket,
  removeLoggedInSocket,
  notifySocketsToAll,
  notifyConnectedSocket,
  notifyDisconnectedSocket,
  notifyLoggedInSocket,
  notifyLoggedOutSocket,
  initializeSocketSets,
} from "@debug";

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

function initializeSocketSession(
  socket: Socket,
  sessionId: string | null = null
): void {
  /** @socket_update */
  socket.sessionId = sessionId ?? crypto.randomUUID(); // you can re-use session ID
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

    // Error
    if (!matched && !modified) {
      throw handleDBError(
        new Error(
          "Failed to update session connection status (given session ID might not exist)."
        ),
        "checkAndRestoreSession"
      );
    }

    /** @socket_update - Restore session logic */
    socket.sessionId = session._id;
    socket.connected = true;
    socket.userId = session.user?._id ?? null;
    socket.roomId = session.room?._id ?? null;
    socket.restoredSession = { user: session.user, room: session.room };
    // Don't forget to join the socket to room if room ID exists
    session.room?._id && socket.join(session.room._id);

    /** @debug */ logSocketEvent("User Session Restored", socket);
    return true;
  }

  // Session not found
  return false;
}

const socketHandlers = (io: Server) => {
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
          initializeSocketSession(socket, sessionId);
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
      handleServerError(error, "io.use()");
      next(new Error("Internal server error")); // Pass an error to the next middleware
    }
  });

  // Handle the error, which has been forwarded through 'next()' in the middleware.
  io.on("error", (error) => {
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
    handleSocketWaitRoom(socket);
    handleSocketLeaveRoom(socket);
    handleSocketInitialize(socket, io);

    /** @debug */
    console.log(`\n[*] ${io.engine.clientsCount} sockets connected.`);
    // console.log(io.sockets.adapter.rooms);
    console.log(socket.rooms);
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

const disconnectionTimeouts = new Map(); // Store timeouts by socket ID

/** @socket_handler - Connect */
const handleSocketConnection = (socket: Socket, io: Server) => {
  // When a socket reconnects, clear the disconnection timeout if it exists
  const timeout = disconnectionTimeouts.get(socket.userId);
  if (timeout) {
    clearTimeout(timeout);
    disconnectionTimeouts.delete(socket.userId);
    logSocketEvent("Disconnection Timeout Cleared", socket);
  }

  /** @debug */
  addConnectedSocket(socket.id);
  notifyConnectedSocket(socket);
  notifySocketsToAll(io);
  logSocketEvent("User Connected", socket);
};

const socketLeaveRoomTimer = async (socket: Socket): Promise<void> => {
  // Set a timeout to wait for reconnection
  const timeout = setTimeout(async () => {
    // Start a new session for the transaction
    const dbSession = getDB().startSession();

    try {
      if (socket.userId && socket.roomId) {
        /** @db_call - Remove player from the room after 1 minute */
        const { user, room } = await handleLeaveRoom(
          socket.sessionId,
          socket.userId,
          socket.roomId,
          dbSession
        );

        // Update socket info & notify others in the room
        socketLeaveRoom(socket, user, room);
        logSocketEvent("Leave Room", socket);
      }
    } catch (error) {
      // If an error occurs, abort the transaction if it exists
      if (dbSession && dbSession.inTransaction())
        await dbSession.abortTransaction();

      handleServerError(error, "handleSocketDisconnect");
    } finally {
      // End the session whether success or failure
      await dbSession.endSession();

      // Remove sockets from the timeouts
      disconnectionTimeouts.delete(socket.userId);
    }
  }, 10000); // 10 sec

  disconnectionTimeouts.set(socket.id, timeout);
  logSocketEvent("Disconnection Timeout Set", socket);
};

/** @socket_handler - Disconnect */
const handleSocketDisconnect = (socket: Socket, io: Server) => {
  socket.on("disconnect", async () => {
    socket.connected = false; /** @socket_update */

    try {
      if (socket.userId) {
        // If user registered in room
        if (socket.roomId) {
          /** @db_call - Update session if user registered */
          await handleSaveSession(socket);

          /** @todo - No need to let other players in the room know. After 1 min of user disconnected, just leave room. */
          await socketLeaveRoomTimer(socket);
        }

        /** @db_call - Update session if user registered */
        await handleSaveSession(socket);
      }
    } catch (error) {
      handleServerError(error, "handleSocketDisconnect");
      /** @todo - Delete session or Save every user info to localstorage for emergency */
    } finally {
      // Despite error happens, you must notify to game room that player has disconnected.
      // if (socket.userId && socket.roomId) {
      //   /** @db_call */
      //   const user = await getUserInfo(socket.userId);
      //   const room = await getRoomInfo(socket.roomId);

      //   /** @socket_emit - Notify others in the room */
      //   socket
      //     .to(socket.roomId)
      //     .emit("player-disconnected", { user: user, room: room });
      // }

      /** @debug */
      removeConnectedSocket(socket.id);
      notifyDisconnectedSocket(socket);
      notifySocketsToAll(io);
      logSocketEvent("User Disconnected", socket);
    }
  });
};

/** @socket_handler - Login */
const handleSocketLogin = (socket: Socket, io: Server) => {
  socket.on("login", async (userName: string, callback: Function) => {
    // Start a new session for the transaction
    const dbSession = getDB().startSession();

    try {
      // Start a transaction session
      dbSession.startTransaction();

      /** @db_call - Add new user */
      const newUserObj = await handleLogin(
        socket.sessionId,
        userName,
        dbSession
      );

      /** @socket_update - Register new user info to socket */
      socket.userId = newUserObj._id;
      socket.connected = true;

      /** @db_call - Save session */
      await handleSaveSession(socket, dbSession);

      // Commit the transaction
      await dbSession.commitTransaction();

      /** @socket_emit - Send back result to client */
      callback(null, newUserObj); // socket.emit("login_success", newUserObj);

      /** @debug */
      addLoggedInSocket(socket.id);
      notifyLoggedInSocket(socket);
      notifySocketsToAll(io);
      logSocketEvent("Login", socket);
    } catch (error) {
      // If an error occurs, abort the transaction if it exists
      if (dbSession && dbSession.inTransaction())
        await dbSession.abortTransaction();

      handleServerError(error, "handleSocketLogin");
      callback(error, null); // socket.emit("login_error", error.message);
    } finally {
      // End the session whether success or failure
      await dbSession.endSession();
    }
  });
};

/** @socket_handler - Logout */
const handleSocketLogout = (socket: Socket, io: Server) => {
  socket.on("logout", async (callback: Function) => {
    // Start a new session for the transaction
    const dbSession = getDB().startSession();

    try {
      // Check if the user is connected to the socket
      if (!socket.userId)
        throw new Error("[Socket Error]: User is not connected.");

      // Start a transaction session
      dbSession.startTransaction();

      // If room exists then leave room fist
      if (socket.roomId) {
        /** @db_call - Remove player from the room */
        const { user, room } = await handleLeaveRoom(
          socket.sessionId,
          socket.userId,
          socket.roomId,
          dbSession
        ); // room obj or null if room deleted

        // Update socket info & notify others in the room
        socketLeaveRoom(socket, user, room);
        // socket.emit("leave-room_success");

        /** @debug */
        logSocketEvent("Leave Room", socket);
      }

      /** @db_call - Delete user */
      await handleLogout(socket.userId, dbSession);

      /** @socket_update - Initialize socket information */
      socket.userId = null;
      socket.roomId = null;
      socket.connected = false;

      /** @db_call - Save session */
      await handleSaveSession(socket, dbSession);

      // Commit the transaction
      await dbSession.commitTransaction();

      /** @socket_emit - Send back result to client */
      callback(null); // socket.emit("logout_success");

      /** @debug */
      removeLoggedInSocket(socket.id);
      notifyLoggedOutSocket(socket);
      notifySocketsToAll(io);
      logSocketEvent("Logout", socket);
    } catch (error) {
      // If an error occurs, abort the transaction if it exists
      if (dbSession && dbSession.inTransaction())
        await dbSession.abortTransaction();

      handleServerError(error, "handleSocketLogout");
      callback(error, null); // socket.emit("logout_error", error.message);
    } finally {
      // End the session whether success or failure
      await dbSession.endSession();
    }
  });
};

/** @socket_handler - Create Room */
const handleSocketCreateRoom = (socket: Socket) => {
  socket.on("create-room", async (callback: Function) => {
    // Start a new session for the transaction
    const dbSession = getDB().startSession();

    try {
      // Check if the user is connected to the socket
      if (!socket.userId)
        throw new Error("[Socket Error]: User is not connected.");

      // Start a transaction session
      dbSession.startTransaction();

      /** @db_call - Create new room */
      const { user, room } = await handleCreateRoom(
        socket.sessionId,
        socket.userId,
        dbSession
      );

      // Commit the transaction
      await dbSession.commitTransaction();

      // Update socket info & notify others in the room
      socketJoinRoom(socket, user, room);

      /** @socket_emit - Send back result to client */
      callback(null, { user, room }); // socket.emit("create-room_success", { user, room });
    } catch (error) {
      // If an error occurs, abort the transaction if it exists
      if (dbSession && dbSession.inTransaction())
        await dbSession.abortTransaction();

      handleServerError(error, "handleSocketCreateRoom");
      callback(error, null); // socket.emit("create-room_error", error.message);
    } finally {
      // End the session whether success or failure
      await dbSession.endSession();
    }
  });
};

/** @socket_handler - Join Room */
const handleSocketJoinRoom = (socket: Socket) => {
  socket.on("join-room", async (roomId: string, callback: Function) => {
    // Start a new session for the transaction
    const dbSession = getDB().startSession();

    try {
      // Check if the user is connected to the socket
      if (!socket.userId)
        throw new Error("[Socket Error]: User is not connected.");

      // Start a transaction session
      dbSession.startTransaction();

      /** @db_call - Join room */
      const response = await handleJoinRoom(
        socket.sessionId,
        socket.userId,
        roomId,
        dbSession
      );

      // [1] User can join room
      if (typeof response === "object") {
        const { user, room } = response;

        // Update socket info & notify others in the room
        socketJoinRoom(socket, user, room);

        /** @socket_emit - Send back result to client */
        callback(null, { user, room }); // socket.emit("join-room_success", { user, room });
      }

      // [2] User cannot join room
      else if (typeof response === "string") {
        /** @socket_emit - Send back result to client */
        callback(null, response); // socket.emit("join-room_failure", response);
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

      handleServerError(error, "handleSocketJoinRoom");
      callback(error, null); // socket.emit("join-room_error", error.message);
    } finally {
      // End the session whether success or failure
      await dbSession.endSession();
    }
  });
};

/** @socket_handler - Wait Room */
const handleSocketWaitRoom = (socket: Socket) => {
  socket.on("wait-room", async (room: Room, callback: Function) => {
    try {
      // Check if the user is connected to the socket
      if (!socket.userId)
        throw new Error("[Socket Error]: User is not connected.");
      if (!socket.roomId)
        throw new Error("[Socket Error]: Room is not connected.");

      /** @db_call - Convert player IDs to User objects */
      const players = await convertPlayerIdsToPlayerObjs(room.players);

      /** @socket_emit - Send back result to client */
      callback(null, players); // socket.emit("wait-room_success", response);
    } catch (error) {
      handleServerError(error, "handleSocketWaitRoom");
      callback(error, null); // socket.emit("wait-room_error", error.message);
    }
  });
};

/** @socket_handler - Leave Room */
const handleSocketLeaveRoom = (socket: Socket) => {
  socket.on("leave-room", async (callback: Function) => {
    // Start a new session for the transaction
    const dbSession = getDB().startSession();

    try {
      // Check if the user and room is connected to the socket
      if (!socket.userId)
        throw new Error("[Socket Error]: User is not connected.");
      if (!socket.roomId)
        throw new Error("[Socket Error]: Room is not connected.");

      // Start a transaction session
      dbSession.startTransaction();

      /** @db_call - Remove player from the room */
      const { user, room } = await handleLeaveRoom(
        socket.sessionId,
        socket.userId,
        socket.roomId,
        dbSession
      ); // room obj or null if room deleted

      // Commit the transaction
      await dbSession.commitTransaction();

      // Update socket info & notify others in the room
      socketLeaveRoom(socket, user, room);

      /** @socket_emit - Send back result to client */
      callback(null); //  socket.emit("leave-room_success");

      /** @debug */
      logSocketEvent("Leave Room", socket);
    } catch (error) {
      // If an error occurs, abort the transaction if it exists
      if (dbSession && dbSession.inTransaction())
        await dbSession.abortTransaction();

      handleServerError(error, "handleSocketLeaveRoom");
      callback(error, null); //socket.emit("leave-room_error", error.message);
    } finally {
      // End the session whether success or failure
      await dbSession.endSession();
    }
  });
};

/** @debug */ /** @socket_handler - Initialize */
const handleSocketInitialize = (socket: Socket, io: Server) => {
  socket.on("initialize", async (callback: Function) => {
    if (process.env.NODE_ENV !== "production") {
      // Start a new session for the transaction
      const dbSession = getDB().startSession();

      try {
        // Start a transaction session
        dbSession.startTransaction();

        /** @db_call - Delete all rooms, users, and sessions */
        // Use Promise.all to wait for both requests to complete
        const results = await Promise.all([
          deleteAllRooms(),
          deleteAllUsers(),
          deleteAllSessions(),
        ]);

        // Simplify the response based on the delete operations' success
        const [roomsDeleted, usersDeleted, sessionsDeleted] = results.map(
          (result) => !!result
        );

        // Commit the transaction
        await dbSession.commitTransaction();

        /** @socket_emit - Send back result to client */
        callback(null, { roomsDeleted, usersDeleted, sessionsDeleted }); // socket.emit("initialize_success", {roomsDeleted, usersDeleted, sessionsDeleted});

        /** @socket_update - Initialize socket */
        socket.sessionId = "";
        socket.connected = false;
        socket.userId = null;
        socket.roomId = null;
        socket.restoredSession = { user: null, room: null }; // Store session information to send to client on initial connect

        /** @debug */
        initializeSocketSets();
        notifySocketsToAll(io);
        logSocketEvent("Initialize", socket);
      } catch (error) {
        // If an error occurs, abort the transaction if it exists
        if (dbSession && dbSession.inTransaction())
          await dbSession.abortTransaction();

        handleServerError(error, "handleSocketInitialize");
        callback(error, null); // socket.emit("initialize_error", error.message);
      } finally {
        // End the session whether success or failure
        await dbSession.endSession();
      }
    }
  });
};

const socketJoinRoom = (socket: Socket, user: User, room: Room): void => {
  /** @socket_update */
  // Update socket info
  socket.roomId = room._id;
  // Join the user to a socket room
  socket.join(room._id);

  /** @socket_emit */
  // Notify others in the room
  socket.to(room._id).emit("new-player", { user, room });
};

const socketLeaveRoom = (
  socket: Socket,
  user: User,
  room: Room | null
): void => {
  // Check if the room is connected to the socket
  if (socket.roomId) {
    /** @socket_update - Leave the user from the socket room */
    socket.leave(socket.roomId);

    /** @socket_emit - Notify others in the room */
    room && socket.to(socket.roomId).emit("player-left", { user, room });

    /** @socket_update - Update socket info */
    socket.roomId = null;
  }
};

export default socketHandlers;
