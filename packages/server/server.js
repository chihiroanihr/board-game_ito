// server/index.js
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";

import handleLogin from "./routes/handleLogin.js";
import handleLogout from "./routes/handleLogout.js";
import handleCreateRoom from "./routes/handleCreateRoom.js";
import handleJoinRoom from "./routes/handleJoinRoom.js";
import handleLeaveRoom from "./routes/handleLeaveRoom.js";
/** @debug */
import { deleteAllRooms } from "./controllers/roomController.js";
import { deleteAllUsers } from "./controllers/userController.js";

const PORT = process.env.PORT || 3001;
// "undefined" means the URL will be computed from the `window.location` object
// const CLIENT_URL =
//   process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000";

// Creating a http server using express
const app = express();

app.use(cors());
app.use(bodyParser.json());

const server = createServer(app);
// the io variable can be used to do all the necessary things regarding Socket
const io = new Server(server, {
  cors: {
    origin: "*", // CLIENT_URL
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("message", (data) => {
    io.emit("message", `${socket.id.substring(0, 5)}: ${data}`);
  });

  /** @socket - Login */
  socket.on("login", async (data) => {
    const { socketId, userName } = data;
    const response = await handleLogin(userName);
    socket.emit("login", response);
    console.log(`[Login]: ${socketId}`);
  });

  /** @socket - Logout */
  socket.on("logout", async (data) => {
    const { socketId, user, room } = data;
    const response = await handleLogout(user, room);
    socket.emit("logout", response);
    console.log(`[Logout]: ${socketId}`);
  });

  socket.on("createRoom", async (data) => {
    const { socketId, user } = data;
    const response = await handleCreateRoom(user);
    // Send response
    socket.emit("createRoom", response);
    console.log(`[Create Room]: ${socketId}`);

    if (response.success) {
      const roomId = response.result.room.id;
      // Join the user to a socket room
      socket.join(roomId);
      // Send message to all users currently in the room, apart from the user that just joined
      io.to(roomId).emit("waitingRoom", response); //io.to(response.result.room.id).emit("waitingRoom", user);
      console.log(`[Waiting Room]: ${socketId}`);
    }
  });

  socket.on("joinRoom", async (data) => {
    const { socketId, user, roomId } = data;
    const response = await handleJoinRoom(user, roomId);
    // Send response
    socket.emit("joinRoom", response);
    console.log(`[Join Room]: ${socketId}`);

    if (response.success) {
      const roomId = response.result.room.id;
      // Join the user to a socket room
      socket.join(roomId);
      // Send message to all users currently in the room, apart from the user that just joined
      io.to(roomId).emit("waitingRoom", response);
      console.log(`[Waiting Room]: ${socketId}`);
    }
  });

  socket.on("leaveRoom", async (data) => {
    const { socketId, user, room } = data;
    const response = await handleLeaveRoom(user, room);
    // Send response
    socket.emit("leaveRoom", response);
    console.log(`[Leave Room]: ${socketId}`);
  });

  // Disconnect event
  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);
  });

  // console.log(io.sockets.adapter.rooms);
});

// Main Route
app.get("/", async (req, res) => {
  res.status(200).send("Server Side.");
});

/** @debug - Initialize json-server database */
app.delete("/initialize", async (req, res) => {
  try {
    // Use Promise.all to wait for both requests to complete
    const [rooms, users] = await Promise.all([
      deleteAllRooms(),
      deleteAllUsers(),
    ]);
    // Delete success
    if (rooms && !users) {
      res.status(200).json({ roomsDeleted: true, usersDeleted: false });
    } else if (!rooms && users) {
      res.status(200).json({ roomsDeleted: false, usersDeleted: true });
    } else if (rooms && users) {
      res.status(200).json({ roomsDeleted: true, usersDeleted: true });
    } else {
      res.status(200).json({ roomsDeleted: false, usersDeleted: false });
    }
  } catch (error) {
    // Error
    console.log("[Error]: ", error);
    res.status(500).send(error);
  }
});

/**
 * Start Server
 */
const startServer = () => {
  try {
    /** @todo: Connect to Database */
    // Open Server
    server.listen(PORT, () =>
      console.log(`Server has started on port http://localhost:${PORT}`)
    );
  } catch (error) {
    console.log("[Error]: ", error);
  }
};

startServer();
