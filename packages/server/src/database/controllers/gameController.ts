import { ClientSession, ObjectId, ReturnDocument } from 'mongodb';

import type { Game } from '@bgi/shared';

import { getDB } from '../dbConnect';
import { logQueryEvent } from '../../log';

export const getGameInfo = async (gameId: ObjectId): Promise<Game | null> => {
  logQueryEvent('Fetching the game info.');

  return await getDB().games.findOne({ _id: gameId }); // session object or null
};

export const insertGame = async (
  newGameObj: Game,
  dbSession: ClientSession | null = null
): Promise<boolean> => {
  logQueryEvent('Inserting new game.');

  // Options object
  const options = dbSession ? { session: dbSession } : {};

  // Execute insert
  const result = await getDB().games.insertOne(newGameObj, options);
  return result.acknowledged; // true or false
};

export const upsertGame = async (
  newGameObj: Game,
  dbSession: ClientSession | null = null
): Promise<Game | null> => {
  logQueryEvent('Upserting new game.');

  // Destructure game._id from newGameObj and store the rest of the properties in gameData
  const { _id, roomId, ...gameData } = newGameObj;

  // Options object
  const options = dbSession
    ? {
        returnDocument: ReturnDocument.AFTER,
        upsert: true,
        session: dbSession,
        includeResultMetadata: false,
      }
    : {
        returnDocument: ReturnDocument.AFTER,
        upsert: true,
        includeResultMetadata: false,
      }; // return the updated document

  // Result will contain the updated or original (if no modification) document,
  // or null if no document was found.
  return await getDB().games.findOneAndUpdate({ roomId: roomId }, { $set: gameData }, options);
};

export const deleteGame = async (
  gameId: ObjectId,
  dbSession: ClientSession | null = null
): Promise<boolean> => {
  logQueryEvent('Deleting the game.');

  // Options object
  const options = dbSession ? { session: dbSession } : {};

  // Execute delete
  const result = await getDB().games.deleteOne({ _id: gameId }, options);

  return result.deletedCount === 1; // true or false
};
