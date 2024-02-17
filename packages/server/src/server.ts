// server/index.js
import dotenv from "dotenv";
import path from "path";
import express, { Express } from "express";
import cors from "cors";
import { createServer, Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import { connectDB, closeDB } from "./database/dbConnect";
import socketHandler from "./socketHandler";

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const SERVER_URL: string = `${process.env.SERVER_PORT}`;

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

// Main Route
app.get("/", async (req, res) => {
  res.status(200).send("Server Side.");
});

/**
 * Start Server
 */
const startServer = async (): Promise<void> => {
  try {
    // Connect to the Database
    await connectDB(); // This will establish the connection and set the db variable in dbConnect module.

    // Call the function to initialize sockets
    socketHandler(io);

    // Open Server
    const serverInstance = server.listen(SERVER_URL, () =>
      console.log(`[*] Server has started on http://localhost:${SERVER_URL}`)
    );

    // Handle graceful shutdown (e.g., from pressing Ctrl+C in the terminal or from a process manager trying to stop the app).
    const gracefulShutdown = async () => {
      try {
        // [1] Close server
        await new Promise<void>((resolve, reject) => {
          serverInstance.close((err) => {
            if (err) {
              console.error("[!] Error closing the server:", err);
              reject(err); // Reject the promise if there's an error
            } else {
              console.log("[*] Server closed successfully.");
              resolve(); // Resolve the promise when close completes without error
            }
          });
        });

        // [2] Ensure you close your database connection here
        await closeDB();
        console.log("[*] Database connection closed.");
      } catch (error) {
        console.error("[!] Error during shutdown:", error);
        process.exit(1); // Exit with error
      }
      process.exit(0); // Successful exit
    };

    // Event handlers listening for shutdown signals
    process.once("SIGINT", async () => {
      console.log("[*] Received SIGINT. Graceful shutdown start.");
      await gracefulShutdown();
    });
    process.once("SIGTERM", async () => {
      console.log("[*] Received SIGTERM. Graceful shutdown start.");
      await gracefulShutdown();
    });
  } catch (error) {
    console.error("[!] Unable to connect to the database:", error);
    process.exit(1);
  }
};

startServer();
