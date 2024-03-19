import express, { type Express } from 'express';
import cors from 'cors';
import { createServer, Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { connectDB, closeDB } from './database/dbConnect';
import router from './routes/routeHandlers';
import socketHandlers from './socket/socketHandlers';
import loadConfig from './config';

// Load env config first
const { serverPort } = loadConfig();

// Creating a http server using express
const app: Express = express();
// Middlewares
app.use(
  // CORS allows HTTP requests sent by the frontent (specified in origin) to reach the server.
  cors({
    origin: '*' /** @todo - Later change to board-game_ito domain */,
  })
);
app.use(express.json()); // Using express.json() instead of bodyParser.json() due to deprecation.
app.use(router); // Mount the routes

// HTTP server initialization
const server: HTTPServer = createServer(app);

// Socket.io server initialization
const io: SocketIOServer = new SocketIOServer(server, {
  cors: { origin: '*' } /** @todo - Later change to board-game_ito domain */,
});

/**
 * Start Server
 */
const startServer = async (): Promise<void> => {
  try {
    // Connect to the DB: Create a promise that resolves when the database connection is established
    await connectDB();

    // Call the function to initialize sockets
    socketHandlers(io);

    // Open Server
    const serverInstance = server.listen(serverPort, () =>
      console.log(`[*] Server has started on port ${serverPort}`)
    );

    setupGracefulShutdown(serverInstance);
  } catch (error) {
    console.error('[!] Unable to connect to the database: ', error);
    process.exit(1);
  }
};

// Handle graceful shutdown (e.g., from pressing Ctrl+C in the terminal or from a process manager trying to stop the app).
function setupGracefulShutdown(serverInstance: HTTPServer) {
  const gracefulShutdown = async () => {
    try {
      console.log('...Initiating graceful shutdown...');

      await Promise.all([
        // [1] Close server
        new Promise<void>((resolve, reject) => {
          serverInstance.close((err) => {
            if (err) {
              console.error('[!] Error closing the server: ', err);
              reject(err); // Reject the promise if there's an error
            } else {
              console.log('[*] Server closed successfully.');
              resolve(); // Resolve the promise when close completes without error
            }
          });
        }),

        // [2] Close database connection
        closeDB(),
      ]);
      console.log('[*] Database connection closed.');
    } catch (error) {
      console.error('[!] Error during shutdown: ', error);
      process.exit(1); // Exit with error
    }
    process.exit(0); // Successful exit
  };

  // Event handlers listening for shutdown signals
  process.once('SIGINT', async () => {
    console.log('[*] Received SIGINT. Graceful shutdown start.');
    await gracefulShutdown();
  });
  process.once('SIGTERM', async () => {
    console.log('[*] Received SIGTERM. Graceful shutdown start.');
    await gracefulShutdown();
  });
}

startServer();
