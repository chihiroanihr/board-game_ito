// server/index.js
import express, { Express } from 'express';
import cors from 'cors';
import { createServer, Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { connectDB, closeDB } from './database/dbConnect';
import router from './routes/routeHandlers';
import socketHandlers from './socket/socketHandlers';

import { loadEnv } from './utils';

// Load .env first
try {
  loadEnv();
  if (process.env.NODE_ENV !== 'production') console.log('[*] .env file loaded successfully');
} catch (error) {
  if (process.env.NODE_ENV !== 'production')
    console.error('[!] Failed to load the .env file: ', error);

  process.exit(1); // Exit with error
}

// Config
const SERVER_URL: string = `${process.env.SERVER_PORT}`;
const CLIENT_URL: string | undefined = process.env.NODE_ENV === 'production' ? undefined : '*'; // "undefined" means the URL will be computed from the `window.location` object

// Creating a http server using express
const app: Express = express();
// Middlewares
app.use(cors());
app.use(express.json()); // Using express.json() instead of bodyParser.json() due to deprecation.
app.use(router); // Mount the routes

// HTTP server initialization
const server: HTTPServer = createServer(app);

// Socket.io server initialization
const io: SocketIOServer = new SocketIOServer(server, {
  // CORS allows HTTP requests sent by the frontent (specified in origin) to reach the server.
  cors: { origin: CLIENT_URL ?? '*' }
});

/**
 * Start Server
 */
const startServer = async (): Promise<void> => {
  try {
    // Connect to the DB: Create a promise that resolves when the database connection is established
    const dbConnectionPromise = connectDB();

    // Create a promise that rejects after 10 seconds
    const timeoutPromise = new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('Database connection timeout.'));
      }, 20000); // 10 seconds
    }); // Comment out the timeout throw error to see the real error issues.

    // Wait for either the database connection or the timeout
    await Promise.race([dbConnectionPromise, timeoutPromise]);

    // Call the function to initialize sockets
    socketHandlers(io);

    // Open Server
    const serverInstance = server.listen(SERVER_URL, () =>
      console.log(`[*] Server has started on http://localhost:${SERVER_URL}`)
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
        closeDB()
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
