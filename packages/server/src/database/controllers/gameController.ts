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

  // Execute insert
  const result = await getDB().games.insertOne(
    // Insert
    newGameObj,
    // Option
    dbSession ? { session: dbSession } : {}
  );

  return result.acknowledged; // true or false
};

export const upsertGame = async (
  newGameObj: Game,
  dbSession: ClientSession | null = null
): Promise<Game | null> => {
  logQueryEvent('Upserting new game.');

  // Destructure game._id from newGameObj and store the rest of the properties in gameData
  const { _id, roomId, ...gameData } = newGameObj;

  // Result will contain the updated or original (if no modification) document, or null if no document was found.
  return await getDB().games.findOneAndUpdate(
    // Filter
    { roomId: roomId },
    // Update
    { $set: gameData },
    // Option
    dbSession
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
        } // return the updated document
  );
};

export const deleteGame = async (
  gameId: ObjectId,
  dbSession: ClientSession | null = null
): Promise<boolean> => {
  logQueryEvent('Deleting the game.');

  // Execute delete
  const result = await getDB().games.deleteOne(
    // Filter
    { _id: gameId },
    // Option
    dbSession ? { session: dbSession } : {}
  );

  return result.deletedCount === 1; // true or false
};

export const updateRoundThemeChosenBy = async (
  playerId: ObjectId,
  gameId: ObjectId,
  roundId: ObjectId,
  dbSession: ClientSession | null = null
): Promise<boolean> => {
  logQueryEvent('Updating the "themeChosenBy" in the given game round.');

  const result = await getDB().games.updateOne(
    // Filter
    {
      _id: gameId,
      'rounds._id': roundId,
    },
    // Update
    {
      $set: {
        'rounds.$.themeChosenBy': playerId,
      },
    },
    // Option
    dbSession ? { session: dbSession } : {}
  );

  if (result.matchedCount === 0) {
    console.error('No Game-Round records were matched.');
  }
  if (result.modifiedCount === 0) {
    console.warn('Game-Round records were matched but not modified.');
  }

  return !!result.matchedCount; // Convert into boolean
};
