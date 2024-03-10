import { MongoClient, Collection, Db } from 'mongodb';

import type { Session, User, Room } from '@bgi/shared';

import loadConfig from '../config';

interface DatabaseCollections {
  sessions: Collection<Session>;
  users: Collection<User>;
  rooms: Collection<Room>;
}

// Load env config first
const { connectionString, dbName } = loadConfig();
console.log(connectionString);

const collectionNames = ['sessions', 'users', 'rooms'];

const DB_CONN_URI: string = connectionString; // process.env.MONGODB_CONNECTION_URL || '';
const DB_NAME: string = dbName || '';
let mongoDB: MongoClient | null = null;

const createCollections = async (db: Db) => {
  collectionNames.forEach(async (collectionName) => {
    // Get all existing collections
    const existingCollections = await db.listCollections({}, { nameOnly: true }).toArray();
    // Make them into array of collection names
    const existingCollectionNames = existingCollections.map((col) => col.name);
    // If target collection does not exist
    if (!existingCollectionNames.includes(collectionName)) {
      // Add new collection
      await db.createCollection(collectionName);
      console.log(`[*] New collection "${collectionName}" created.`);
    }
  });
};

const getAllCollections = (db: Db): DatabaseCollections => ({
  sessions: db.collection<Session>('sessions'),
  users: db.collection<User>('users'),
  rooms: db.collection<Room>('rooms')
});

export const getDB = () => {
  if (!mongoDB) throw new Error('[!] Database not initialized.');

  // Return both the collections and a method to start a session
  return {
    ...getAllCollections(mongoDB.db(DB_NAME)), // Access collections
    startSession: () => mongoDB!.startSession()
  };
};

export const connectDB = async (): Promise<DatabaseCollections> => {
  try {
    if (!DB_CONN_URI) {
      throw new Error('[!] Environment variable MONGODB_CONNECTION_URL is not defined.');
    }
    if (!DB_NAME) {
      throw new Error('[!] Environment variable DB_NAME is not defined.');
    }

    // Use existing database client if it's already connected.
    if (mongoDB) {
      console.log('[*] Already connected to MongoDB.');
      return getAllCollections(mongoDB.db(DB_NAME));
    }

    console.log('...Connecting to MongoDB...');
    const client = new MongoClient(DB_CONN_URI); // Creates a new instance of the MongoClient with the specified connection URI.
    await client.connect(); // Async operation to connect the client to the MongoDB server.
    mongoDB = client; // Store the connected client globally.
    console.log('[*] Connected to db.');

    // Create collections
    await createCollections(mongoDB.db(DB_NAME));

    // Return collections
    return getAllCollections(mongoDB.db(DB_NAME));
  } catch (error) {
    console.error('[!] Error connecting to MongoDB', error);
    throw error;
  }
};

export const closeDB = async (): Promise<void> => {
  if (mongoDB) {
    await mongoDB.close();
    console.log('[*] MongoDB connection closed.');
  }
};
