// server/index.js
import express from "express";
import bodyParser from "body-parser";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

import registerUserRoute from "./routes/registerUserRoute.js";
import createRoomRoute from "./routes/createRoomRoute.js";
import joinRoomRoute from "./routes/joinRoomRoute.js";
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

  socket.on("login", (data) => {
    console.log(
      `[Login]: User ID (${data.user.id}) with socket ID (${data.socketId})`
    );
    io.emit("userLoggedIn", data.user.id);
  });

  socket.on("logout", (data) => {
    console.log(
      `[Logout]: User ID (${data.user.id}) with socket ID (${data.socketId})`
    );
    io.emit("userLoggedOut", data.user.id);
  });

  // Disconnect event
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Use Register User Route
app.use("/user", registerUserRoute);
// Use Create Room Route
app.use("/create", createRoomRoute);
// Use Join Room Route
app.use("/join", joinRoomRoute);

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
