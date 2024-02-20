import crypto from "crypto";
import { Server, Socket } from "socket.io";
import { ClientSession } from "mongodb";

import { User, Room } from "@board-game-ito/shared";

import * as handler from "@handler";
import * as controller from "@controller";
import * as debug from "@debug";

import { getDB } from "../database/dbConnect";

declare module "socket.io" {
  interface Socket {
    sessionId: string;
    connected: boolean;
    user: User | null;
    room: Room | null;
  }
}

function initializeSocketSession(
  socket: Socket,
  sessionId: string | null = null
): void {
  /** @socket_update */
  socket.sessionId = sessionId ?? crypto.randomUUID(); // you can re-use session ID
  socket.connected = true;
  socket.user = null;
  socket.room = null;
}

async function checkAndRestoreSession(
  socket: Socket,
  sessionId: string
): Promise<boolean> {
  // [1] Find existing session from the database
  const session = await handler.handleFindSession(sessionId);
  // * Session found - restore session info
  if (session) {
    // [2] Update session connection status
    const { matched, modified } = await controller.saveSessionConnected(
      sessionId,
      true
    );
    // Error
    if (!matched && !modified) {
      throw debug.handleDBError(
        new Error(
          "Failed to update session connection status (given session ID might not exist)."
        ),
        "checkAndRestoreSession"
      );
    }
    /** [3] @socket_update - Restore session logic */
    socket.sessionId = session._id;
    socket.connected = true;
    socket.user = session.user;
    socket.room = session.room;
    // Don't forget to join the socket to room if room ID exists
    session.room?._id && socket.join(session.room._id);

    debug.logSocketEvent("User Session Restored", socket);
    return true;
  }
  // * Session not found
  return false;
}

const socketHandlers = (io: Server) => {
  // Prevent from current Socket.IO session to change every time the low-level connection between the client and the server is severed.
  io.use(async (socket: Socket, next) => {
    try {
      // [1] Extract session ID (private) sent from client which will be used to authenticate the user upon reconnection
      const sessionId = socket.handshake.auth.sessionId;
      // * Session ID not found from the client
      if (!sessionId) {
        // [2] Create a new session
        initializeSocketSession(socket);
        debug.logSocketEvent("User Session Created", socket);
      }
      // * Session ID found from the client
      else {
        // [2] Assign session info to socket
        const sessionRestored = await checkAndRestoreSession(socket, sessionId);
        // * No matching session ID found from the server
        if (!sessionRestored) {
          // [3] Create a new session
          initializeSocketSession(socket, sessionId);
          debug.logSocketEvent(
            "User Session Created (no matching session)",
            socket
          );
        }
      }
      next();
    } catch (error) {
      debug.handleServerError(error, "io.use()");
      // Pass an error to the next middleware
      next(new Error("Internal server error"));
    }
  });

  // Handle the error, which has been forwarded through 'next()' in the middleware.
  io.on("error", (error) => {
    console.error("Connection failed:", error.message);
    console.error("Error data:", error.data.content);
  });

  // The io variable can be used to do all the necessary things regarding Socket
  io.on("connection", (socket) => {
    socket.emit("connected");

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
    console.log(socket.rooms);
    // console.log(io.sockets.adapter.rooms);
  });
};

/** @socket_handler - Session */
const handleSocketSession = (socket: Socket) => {
  /** @socket_emit - Send session info */
  socket.emit("session", {
    sessionId: socket.sessionId,
    user: socket.user,
    room: socket.room,
  });
};

/** @socket_handler - Connect */
const handleSocketConnection = (socket: Socket, io: Server) => {
  debug.addConnectedSocket(socket.id);
  debug.notifyConnectedSocket(socket);
  debug.notifySocketsToAll(io);
  debug.logSocketEvent("User Connected", socket);
};

const disconnectLeaveRoom = async (
  socket: Socket,
  dbSession: ClientSession
): Promise<void> => {
  try {
    if (socket.user?._id && socket.room?._id) {
      // [1] Remove player from the room after 1 minute
      const { user, room } = await handler.handleLeaveRoom(
        socket.sessionId,
        socket.user._id,
        socket.room._id,
        dbSession
      );
      // [2] Update socket info & notify others in the room
      socketLeaveRoom(socket, user, room);
      debug.logSocketEvent("Leave Room", socket);
    }
  } catch (error) {
    debug.handleServerError(error, "handleSocketDisconnect");
  }
};

/** @socket_handler - Disconnect */
const handleSocketDisconnect = (socket: Socket, io: Server) => {
  socket.on("disconnect", async () => {
    // [1] Must update socket connected status first
    socket.connected = false;
    // Start a new session for the transaction
    const dbSession = getDB().startSession();
    try {
      // * If user already registered
      if (socket.user?._id) {
        // Start a transaction session
        dbSession.startTransaction();
        // [2] If user in room and room is not playing, then just leave room
        socket.room?._id && (await disconnectLeaveRoom(socket, dbSession));
        // [3] Update session
        await handler.handleSaveSession(socket);
        // Commit the transaction
        await dbSession.commitTransaction();
        debug.removeConnectedSocket(socket.id);
        debug.notifyDisconnectedSocket(socket);
        debug.notifySocketsToAll(io);
        debug.logSocketEvent("User Disconnected", socket);
      }
    } catch (error) {
      /** @todo - Delete session or Save every user info to local storage for emergency */
      // If an error occurs, abort the transaction if it exists
      if (dbSession && dbSession.inTransaction())
        await dbSession.abortTransaction();
      debug.handleServerError(error, "handleSocketDisconnect");
    } finally {
      // End the session whether success or failure
      await dbSession.endSession();
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
      // [1] Add new user
      const newUserObj = await handler.handleLogin(userName, dbSession);
      /** [2] @socket_update - Register new user info to socket */
      socket.user = newUserObj;
      socket.connected = true;
      // [3] Save session
      await handler.handleSaveSession(socket, dbSession);
      // Commit the transaction
      await dbSession.commitTransaction();
      /** @socket_emit - Send back result to client */
      callback(null, newUserObj);
      debug.addLoggedInSocket(socket.id);
      debug.notifyLoggedInSocket(socket);
      debug.notifySocketsToAll(io);
      debug.logSocketEvent("Login", socket);
    } catch (error) {
      // If an error occurs, abort the transaction if it exists
      if (dbSession && dbSession.inTransaction())
        await dbSession.abortTransaction();
      /** @socket_emit - Send back error to client */
      callback(error, null);
      debug.handleServerError(error, "handleSocketLogin");
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
      // * If user is not connected
      if (!socket.user?._id)
        throw new Error("[Socket Error]: User is not connected.");

      // Start a transaction session
      dbSession.startTransaction();
      // * If user has room
      if (socket.room?._id) {
        // (1) Remove player from the room (Return : Room | null (room deleted))
        const { user, room } = await handler.handleLeaveRoom(
          socket.sessionId,
          socket.user._id,
          socket.room._id,
          dbSession
        );
        // (2) Update socket info & notify others in the room
        socketLeaveRoom(socket, user, room);
        debug.logSocketEvent("Leave Room", socket);
      }
      // [1] Delete user
      await handler.handleLogout(socket.user._id, dbSession);
      /** [2] @socket_update - Initialize socket information */
      socket.user = null;
      socket.room = null;
      socket.connected = false;
      // [3] Save session
      await handler.handleSaveSession(socket, dbSession);
      // Commit the transaction
      await dbSession.commitTransaction();
      /** [4] @socket_emit - Send back result to client */
      callback(null);
      debug.removeLoggedInSocket(socket.id);
      debug.notifyLoggedOutSocket(socket);
      debug.notifySocketsToAll(io);
      debug.logSocketEvent("Logout", socket);
    } catch (error) {
      // If an error occurs, abort the transaction if it exists
      if (dbSession && dbSession.inTransaction())
        await dbSession.abortTransaction();
      /** @socket_emit - Send back error to client */
      callback(error);
      debug.handleServerError(error, "handleSocketLogout");
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
      // * If user is not connected
      if (!socket.user?._id)
        throw new Error("[Socket Error]: User is not connected.");

      // Start a transaction session
      dbSession.startTransaction();
      // [1] Create new room
      const { user, room } = await handler.handleCreateRoom(
        socket.sessionId,
        socket.user._id,
        dbSession
      );
      // [3] Save session
      await handler.handleSaveSession(socket, dbSession);
      // Commit the transaction
      await dbSession.commitTransaction();
      // [4] Update socket info & notify others in the room
      socketJoinRoom(socket, user, room);
      /** [5] @socket_emit - Send back result to client */
      callback(null, { user, room });
      debug.logSocketEvent("Create Room", socket);
    } catch (error) {
      // If an error occurs, abort the transaction if it exists
      if (dbSession && dbSession.inTransaction())
        await dbSession.abortTransaction();
      /** @socket_emit - Send back result to client */
      callback(error, null);
      debug.handleServerError(error, "handleSocketCreateRoom");
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
      // * If user is not connected
      if (!socket.user?._id)
        throw new Error("[Socket Error]: User is not connected.");

      // Start a transaction session
      dbSession.startTransaction();
      // [1] Join room
      const response = await handler.handleJoinRoom(
        socket.sessionId,
        socket.user._id,
        roomId,
        dbSession
      );
      // * If user can join room
      if (typeof response === "object") {
        // [2] Extract the result
        const { user, room } = response;
        // [3] Update socket info & notify others in the room
        socketJoinRoom(socket, user, room);
        // [4] Save session
        await handler.handleSaveSession(socket, dbSession);
        /** [5] @socket_emit - Send back result to client */
        callback(null, { user, room });
        debug.logSocketEvent("Join Room", socket);
      }
      // * If user cannot join room  // else if (typeof response === "string")
      else {
        /** [2] @socket_emit - Send back result to client */
        callback(null, response);
      }
      // Commit the transaction
      await dbSession.commitTransaction();
    } catch (error) {
      // If an error occurs, abort the transaction if it exists
      if (dbSession && dbSession.inTransaction())
        await dbSession.abortTransaction();
      /** @socket_emit - Send back error to client */
      callback(error, null);
      debug.handleServerError(error, "handleSocketJoinRoom");
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
      // * If user is not connected
      if (!socket.user?._id)
        throw new Error("[Socket Error]: User is not connected.");
      // * If user is not in room
      if (!socket.room?._id)
        throw new Error("[Socket Error]: Room is not connected.");

      // [1] Convert all player IDs to User objects
      const players = await controller.convertPlayerIdsToPlayerObjs(
        room.players
      );
      /** @socket_emit - Send back result to client */
      callback(null, players);
      debug.logSocketEvent("Wait Room", socket);
    } catch (error) {
      /** @socket_emit - Send back error to client */
      callback(error, null);
      debug.handleServerError(error, "handleSocketWaitRoom");
    }
  });
};

/** @socket_handler - Leave Room */
const handleSocketLeaveRoom = (socket: Socket) => {
  socket.on("leave-room", async (callback: Function) => {
    // Start a new session for the transaction
    const dbSession = getDB().startSession();
    try {
      // * If user is not connected
      if (!socket.user?._id)
        throw new Error("[Socket Error]: User is not connected.");
      // * If user is not in room
      if (!socket.room?._id)
        throw new Error("[Socket Error]: Room is not connected.");

      // Start a transaction session
      dbSession.startTransaction();
      // [1] Remove player from the room (Return: Room | null (if room deleted))
      const { user, room } = await handler.handleLeaveRoom(
        socket.sessionId,
        socket.user._id,
        socket.room._id,
        dbSession
      );
      // [2] Update socket info & notify others in the room
      socketLeaveRoom(socket, user, room);
      // [3] Save session
      await handler.handleSaveSession(socket, dbSession);
      // Commit the transaction
      await dbSession.commitTransaction();
      /** @socket_emit - Send back result to client */
      callback(null);
      debug.logSocketEvent("Leave Room", socket);
    } catch (error) {
      // If an error occurs, abort the transaction if it exists
      if (dbSession && dbSession.inTransaction())
        await dbSession.abortTransaction();
      /** @socket_emit - Send back error to client */
      callback(error);
      debug.handleServerError(error, "handleSocketLeaveRoom");
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
        // [1] Delete all rooms, users, and sessions
        // Use Promise.all to wait for both requests to complete
        const results = await Promise.all([
          controller.deleteAllRooms(),
          controller.deleteAllUsers(),
          controller.deleteAllSessions(),
        ]);
        // [2] Simplify the response based on the delete operations' success
        const [roomsDeleted, usersDeleted, sessionsDeleted] = results.map(
          (result: boolean) => !!result
        );
        // Commit the transaction
        await dbSession.commitTransaction();
        /** [3] @socket_emit - Send back result to client */
        callback(null, { roomsDeleted, usersDeleted, sessionsDeleted });
        /** [4] @socket_update - Initialize socket */
        socket.sessionId = "";
        socket.connected = false;
        socket.user = null;
        socket.room = null;

        debug.initializeSocketSets();
        debug.notifySocketsToAll(io);
        debug.logSocketEvent("Initialize", socket);
      } catch (error) {
        // If an error occurs, abort the transaction if it exists
        if (dbSession && dbSession.inTransaction())
          await dbSession.abortTransaction();
        /** @socket_emit - Send back error to client */
        callback(error, null);
        debug.handleServerError(error, "handleSocketInitialize");
      } finally {
        // End the session whether success or failure
        await dbSession.endSession();
      }
    }
  });
};

const socketJoinRoom = (socket: Socket, user: User, room: Room): void => {
  /** [1] @socket_update - Update socket info */
  socket.room = room;
  /** [2] @socket_update - Join the user to a socket room */
  socket.join(room._id);
  /** [3] @socket_emit - Notify others in the room */
  socket.to(room._id).emit("new-player", { user, room });
};

const socketLeaveRoom = (
  socket: Socket,
  user: User,
  room: Room | null
): void => {
  // * If room exists
  if (socket.room) {
    /** [1] @socket_update - Leave the user from the socket room */
    socket.leave(socket.room._id);
    /** [2] @socket_emit - Notify others in the room */
    room && socket.to(socket.room._id).emit("player-left", { user, room });
    /** [3] @socket_update - Update socket info */
    socket.room = null;
  }
};

export default socketHandlers;
