import { MongoClient, Collection, Db } from "mongodb";

import { Session, User, Room } from "@board-game-ito/shared";

import { loadEnv } from "@util";

// Load .env first
try {
  loadEnv();
  if (process.env.NODE_ENV !== "production")
    console.log("[*] .env file loaded successfully");
} catch (error) {
  if (process.env.NODE_ENV !== "production")
    console.error("[!] Failed to load the .env file: ", error);

  process.exit(1); // Exit with error
}

interface DatabaseCollections {
  sessions: Collection<Session>;
  users: Collection<User>;
  rooms: Collection<Room>;
}

const DB_CONN_URI: string = process.env.MONGODB_CONNECTION_URL || "";
const DB_NAME: string = process.env.MONGODB_DATABASE_NAME || "";

let mongoDB: MongoClient | null = null;

const getCollections = (db: Db): DatabaseCollections => ({
  sessions: db.collection<Session>("sessions"),
  users: db.collection<User>("users"),
  rooms: db.collection<Room>("rooms"),
});

export const getDB = () => {
  if (!mongoDB) throw new Error("[!] Database not initialized.");

  // Return both the collections and a method to start a session
  return {
    ...getCollections(mongoDB.db(DB_NAME)), // Access collections
    startSession: () => mongoDB!.startSession(),
  };
};

export const connectDB = async (): Promise<DatabaseCollections> => {
  try {
    if (!DB_CONN_URI) {
      throw new Error(
        "[!] Environment variable MONGODB_CONNECTION_URL is not defined."
      );
    }
    if (!DB_NAME) {
      throw new Error("[!] Environment variable DB_NAME is not defined.");
    }

    // Use existing database client if it's already connected.
    if (mongoDB) {
      console.log("[*] Already connected to MongoDB.");
      return getCollections(mongoDB.db(DB_NAME));
    }

    console.log("...Connecting to MongoDB...");
    const client = new MongoClient(DB_CONN_URI); // Creates a new instance of the MongoClient with the specified connection URI.
    await client.connect(); // Async operation to connect the client to the MongoDB server.
    mongoDB = client; // Store the connected client globally.

    console.log("[*] Connected to db.");
    return getCollections(mongoDB.db(DB_NAME));
  } catch (error) {
    console.error("[!] Error connecting to MongoDB", error);
    throw error;
  }
};

export const closeDB = async (): Promise<void> => {
  if (mongoDB) {
    await mongoDB.close();
    console.log("[*] MongoDB connection closed.");
  }
};

// import { MongoClient } from "mongodb";
// import { loadEnv } from "@util";

// // Ensuring environment variables are loaded at the start
// loadEnv();

// // Simplified interface, assuming it's already defined in "@board-game-ito/shared"
// import { Session, User, Room } from "@board-game-ito/shared";

// // Singleton pattern for MongoDB client
// class DBClient {
//   private static client: MongoClient;
//   private static DB_CONN_URI = process.env.MONGODB_CONNECTION_URL || "";
//   private static DB_NAME = process.env.MONGODB_DATABASE_NAME || "";

//   static async initialize() {
//     if (!this.client) {
//       try {
//         console.log("...Connecting to MongoDB...");
//         this.client = await MongoClient.connect(this.DB_CONN_URI);
//         console.log("[*] Connected to db.");
//       } catch (error) {
//         console.error("[!] Error connecting to MongoDB:", error);
//         throw error;
//       }
//     }
//   }

//   static getCollections() {
//     if (!this.client) {
//       throw new Error("[!] Database not initialized.");
//     }

//     const db = this.client.db(this.DB_NAME);

//     return {
//       sessions: db.collection<Session>("sessions"),
//       users: db.collection<User>("users"),
//       rooms: db.collection<Room>("rooms"),
//       startSession: () => this.client.startSession(),
//     };
//   }

//   static async closeDB() {
//     if (this.client) {
//       await this.client.close();
//       console.log("[*] MongoDB connection closed.");
//     }
//   }
// }

// export const {
//   initialize: connectDB,
//   getCollections: getDB,
//   closeDB,
// } = DBClient;
