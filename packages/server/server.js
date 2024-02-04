// server/index.js
import express from "express";
import bodyParser from "body-parser";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

import handleLogin from "./routes/registerUserRoute.js";
import handleCreateRoom from "./routes/createRoomRoute.js";
import handleJoinRoom from "./routes/joinRoomRoute.js";
import { deleteAllRooms } from "./controllers/roomController.js";
import { deleteAllUsers } from "./controllers/userController.js";

const PORT = process.env.PORT || 3001;
// "undefined" means the URL will be computed from the `window.location` object
const CLIENT_URL =
  process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000";

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Creating a http server using express
const server = http.createServer(app);
// the io variable can be used to do all the necessary things regarding Socket
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  /** @socket - Login */
  socket.on("login", async (data) => {
    const { socketId, userName } = data;
    const response = await handleLogin(userName);
    io.emit("userCreated", response);
    console.log(`[Login]: ${socketId}`);
  });

  /** @socket - Logout */
  socket.on("logout", async (data) => {
    const { socketId, user } = data;
    /** @todo: handle log out function */
    console.log(`[Logout]: ${socketId}`);
  });

  socket.on("createRoom", async (data) => {
    const { socketId, user } = data;
    const response = await handleCreateRoom(user);
    io.emit("roomCreated", response);
    console.log(`[Create Room]: ${socketId}`);
  });

  socket.on("joinRoom", async (data) => {
    const { socketId, user, roomId } = data;
    const response = await handleJoinRoom({ user, roomId });
    io.emit("userJoined", response);
    console.log(`[Join Room]: ${socketId}`);
  });

  // Disconnect event
  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);
  });
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
