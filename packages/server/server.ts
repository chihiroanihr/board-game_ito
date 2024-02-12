// server/index.js
import express, { Express } from "express";
import cors from "cors";
import { createServer, Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import { connectDB, closeDB } from "./database/dbConnect.ts";
import socketHandler from "./socketHandler.ts";

/** @debug */
// import { deleteAllRooms } from "./controllers/roomController.ts";
// import { deleteAllUsers } from "./controllers/userController.ts";

const PORT: string | number = process.env.PORT || 3001;
const CLIENT_URL: string | undefined =
  process.env.NODE_ENV === "production" ? undefined : "*"; // "undefined" means the URL will be computed from the `window.location` object

// Creating a http server using express
const app: Express = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Using express.json() instead of bodyParser.json() since its deprecated.

// HTTP server initialization
const server: HTTPServer = createServer(app);
// Socket.io server initialization
const io: SocketIOServer = new SocketIOServer(server, {
  // CORS allows HTTP requests sent by the frontent (specified in origin) to reach the server.
  cors: {
    origin: CLIENT_URL,
  },
});

// Call the function to initialize sockets
socketHandler(io);

// Main Route
app.get("/", async (req, res) => {
  res.status(200).send("Server Side.");
});

/** @debug - Initialize json-server database */
if (process.env.NODE_ENV !== "production") {
  app.delete("/initialize", async (req, res) => {
    try {
      // Dynamic imports
      const { deleteAllRooms } = await import(
        "./controllers/roomController.ts"
      );
      const { deleteAllUsers } = await import(
        "./controllers/userController.ts"
      );

      // Use Promise.all to wait for both requests to complete
      const results = await Promise.all([deleteAllRooms(), deleteAllUsers()]);
      // Simplify the response based on the delete operations' success
      const [roomsDeleted, usersDeleted] = results.map((result) => !!result);
      // Send deletion success status
      res.status(200).json({ roomsDeleted, usersDeleted });
    } catch (error) {
      console.log("[Error]: ", error);
      res.status(500).send(error);
    }
  });
}

/**
 * Start Server
 */
const startServer = async (): Promise<void> => {
  try {
    // Connect to the Database
    await connectDB(); // This will establish the connection and set the db variable in dbConnect module.

    // Open Server
    const serverInstance = server.listen(PORT, () =>
      console.log(`Server has started on port http://localhost:${PORT}`)
    );

    // Handle graceful shutdown (e.g., from pressing Ctrl+C in the terminal or from a process manager trying to stop the app).
    const gracefulShutdown = async () => {
      try {
        // [1] Close server
        await new Promise<void>((resolve, reject) => {
          serverInstance.close((err) => {
            if (err) {
              console.error("Error closing the server:", err);
              reject(err); // Reject the promise if there's an error
            } else {
              console.log("Server closed successfully.");
              resolve(); // Resolve the promise when close completes without error
            }
          });
        });

        // [2] Ensure you close your database connection here
        await closeDB();
        console.log("Database connection closed.");
      } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1); // Exit with error
      }
      process.exit(0); // Successful exit
    };

    // Event handlers listening for shutdown signals
    process.on("SIGINT", gracefulShutdown);
    process.on("SIGTERM", gracefulShutdown);
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
};

startServer();
