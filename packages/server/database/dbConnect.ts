import { MongoClient, Collection, Db } from "mongodb";

import { Session, User, Room } from "../interfaces/IData";

interface DatabaseCollections {
  sessions: Collection<Session>;
  users: Collection<User>;
  rooms: Collection<Room>;
}

const URI: string = process.env.MONGODB_CONNECTION_URL || "";
const dbName: string = "test";

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
    ...getCollections(mongoDB.db(dbName)), // Access collections
    startSession: () => mongoDB!.startSession(),
  };
};

export const connectDB = async (): Promise<DatabaseCollections> => {
  try {
    // Use existing database client if it's already connected.
    if (mongoDB) {
      console.log("[*] Already connected to MongoDB.");
      return getCollections(mongoDB.db(dbName));
    }

    console.log("...Connecting to MongoDB...");
    const client = new MongoClient(URI); // Creates a new instance of the MongoClient with the specified connection URI.
    await client.connect(); // Async operation to connect the client to the MongoDB server.
    mongoDB = client; // Store the connected client globally.

    console.log("[*] Connected to db.");
    return getCollections(mongoDB.db(dbName));
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
