import { ClientSession, ObjectId, ReturnDocument } from "mongodb";

import { getDB } from "../database/dbConnect";
import { Room } from "../interfaces/IData";
import { logQueryEvent } from "../utils/log";

export const getAllPlayersInRoom = async (
  roomId: string
): Promise<Array<ObjectId> | null> => {
  logQueryEvent("Fetching all players in the room.");

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

export const insertPlayerInRoom = async (
  userId: ObjectId,
  roomId: string,
  dbSession: ClientSession | null = null
): Promise<Room | null> => {
  logQueryEvent("Inserting new player in the room.");

  try {
    const options = dbSession
      ? {
          returnDocument: ReturnDocument.AFTER,
          session: dbSession,
          includeResultMetadata: false,
        }
      : {
          returnDocument: ReturnDocument.AFTER,
          includeResultMetadata: false,
        }; // return the updated document

    // result will contain the updated or original (if no modification) document,
    // or null if no document was found.
    return await getDB().rooms.findOneAndUpdate(
      { _id: roomId },
      { $addToSet: { players: userId } }, // `$addToSet` adds the user without creating duplicates
      options
    );

    // const options = dbSession ? { session: dbSession } : undefined;

    // const result = await getDB().rooms.updateOne(
    //   { _id: roomId },
    //   { $addToSet: { players: userId } }, // `$addToSet` adds the user without creating duplicates
    //   options
    // );

    // return {
    //   matched: result.matchedCount > 0,
    //   modified: result.modifiedCount > 0,
    // }; // true or false
  } catch (error) {
    throw error;
  }
};

export const deletePlayerFromRoom = async (
  userId: ObjectId,
  roomId: string,
  dbSession: ClientSession | null = null
): Promise<Room | null> => {
  logQueryEvent("Deleting the player from the room.");

  try {
    const options = dbSession
      ? {
          returnDocument: ReturnDocument.AFTER,
          session: dbSession,
          includeResultMetadata: false,
        }
      : {
          returnDocument: ReturnDocument.AFTER,
          includeResultMetadata: false,
        }; // return the updated document

    // result will contain the updated or original (if no modification) document,
    // or null if no document was found.
    return await getDB().rooms.findOneAndUpdate(
      { _id: roomId },
      { $pull: { players: userId } }, // `$pull` operator removes the user ID from the array
      options
    );

    // const options = dbSession ? { session: dbSession } : undefined;

    // const result = await getDB().rooms.updateOne(
    //   { _id: roomId },
    //   { $pull: { players: userId } }, // `$pull` operator removes the user ID from the array
    //   options
    // );

    // return {
    //   matched: result.matchedCount > 0,
    //   modified: result.modifiedCount > 0,
    // }; // true or false
  } catch (error) {
    throw error;
  }
};

export const updateRoomAdmin = async (
  userId: ObjectId,
  roomId: string,
  dbSession: ClientSession | null = null
): Promise<Room | null> => {
  logQueryEvent("Updating admin of the room.");

  try {
    const options = dbSession
      ? {
          returnDocument: ReturnDocument.AFTER,
          session: dbSession,
          includeResultMetadata: false,
        }
      : {
          returnDocument: ReturnDocument.AFTER,
          includeResultMetadata: false,
        }; // return the updated document

    // result will contain the updated or original (if no modification) document,
    // or null if no document was found.
    return await getDB().rooms.findOneAndUpdate(
      { _id: roomId },
      { $set: { createdBy: userId } },
      options
    );

    // const options = dbSession ? { session: dbSession } : undefined;

    // const result = await getDB().rooms.updateOne(
    //   { _id: roomId },
    //   { $set: { createdBy: userId } },
    //   options
    // );

    // return {
    //   matched: result.matchedCount > 0,
    //   modified: result.modifiedCount > 0,
    // }; // true or false
  } catch (error) {
    throw error;
  }
};
