import { ClientSession, ObjectId, ReturnDocument } from 'mongodb';

import type { Room, User } from '@bgi/shared';

import { getDB } from '../dbConnect';
import { logQueryEvent } from '../../debug';

export const getAllPlayersInRoom = async (roomId: string): Promise<Array<ObjectId> | null> => {
  logQueryEvent('Fetching all players in the room.');

  try {
    // Fetch the room and project only the players array
    const room = await getDB().rooms.findOne(
      { _id: roomId },
      { projection: { players: 1 } } // only return the players array
    );

    // Return the players array from the room object (an empty array if no players in the room),
    // or null if no room is found
    return room ? room.players : null;
  } catch (error) {
    throw error;
  }
};

export const convertPlayerIdsToPlayerObjs = async (
  playerIds: Array<ObjectId>
): Promise<Array<User>> => {
  logQueryEvent("Converting all players' IDs into User objects.");

  // Convert string ID into object ID
  /*
  There might be scenarios where the actual runtime objects are not being correctly recognized as ObjectId instances by the MongoDB driver. This could be due to:
  Serialization/deserialization processes that convert ObjectId to strings, such as when receiving data over a network or storing/retrieving data from a place that doesn't preserve the original types (like JSON storage, HTTP requests, etc.).
  */
  const playerObjIds: ObjectId[] = playerIds.map((id) => new ObjectId(id));

  try {
    // Return array of User objects if each player (user) ID matches with what's in the database
    const players = await getDB()
      .users.find({ _id: { $in: playerObjIds } })
      .toArray();

    if (players.length !== playerIds.length) {
      throw new Error(
        '[Data Integrity Error]: Given player number does not match the returned player number. Please ensure the data consistency.'
      );
    }

    return players;
  } catch (error) {
    throw error;
  }
};

export const insertPlayerInRoom = async (
  userId: ObjectId,
  roomId: string,
  dbSession: ClientSession | null = null
): Promise<Room | null> => {
  logQueryEvent('Inserting new player in the room.');

  try {
    const options = dbSession
      ? {
          returnDocument: ReturnDocument.AFTER,
          session: dbSession,
          includeResultMetadata: false
        }
      : {
          returnDocument: ReturnDocument.AFTER,
          includeResultMetadata: false
        }; // return the updated document

    // Result will contain the updated or original (if no modification) document,
    // or null if no document was found.
    return await getDB().rooms.findOneAndUpdate(
      { _id: roomId },
      { $addToSet: { players: userId } }, // `$addToSet` adds the user without creating duplicates
      options
    );
  } catch (error) {
    throw error;
  }
};

export const deletePlayerFromRoom = async (
  userId: ObjectId,
  roomId: string,
  dbSession: ClientSession | null = null
): Promise<Room | null> => {
  logQueryEvent('Deleting the player from the room.');

  try {
    const options = dbSession
      ? {
          returnDocument: ReturnDocument.AFTER,
          session: dbSession,
          includeResultMetadata: false
        }
      : {
          returnDocument: ReturnDocument.AFTER,
          includeResultMetadata: false
        }; // return the updated document

    // Result will contain the updated or original (if no modification) document,
    // or null if no document was found.
    return await getDB().rooms.findOneAndUpdate(
      { _id: roomId },
      { $pull: { players: userId } }, // `$pull` operator removes the user ID from the array
      options
    );
  } catch (error) {
    throw error;
  }
};

export const updateRoomAdmin = async (
  userId: ObjectId,
  roomId: string,
  dbSession: ClientSession | null = null
): Promise<Room | null> => {
  logQueryEvent('Updating only the room admin in Room.');

  try {
    const options = dbSession
      ? {
          returnDocument: ReturnDocument.AFTER,
          session: dbSession,
          includeResultMetadata: false
        }
      : {
          returnDocument: ReturnDocument.AFTER,
          includeResultMetadata: false
        }; // return the updated document

    // Result will contain the updated or original (if no modification) document,
    // or null if no document was found.
    return await getDB().rooms.findOneAndUpdate(
      { _id: roomId },
      { $set: { createdBy: userId } },
      options
    );
  } catch (error) {
    throw error;
  }
};
