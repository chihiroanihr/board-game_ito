import { ClientSession, ReturnDocument, ObjectId } from 'mongodb';

import type { Room, RoomStatusEnum, RoomSetting } from '@bgi/shared';

import { getDB } from '../dbConnect';
import { logQueryEvent } from '../../log';

export const getRoomInfo = async (roomId: string): Promise<Room | null> => {
  logQueryEvent('Fetching the room info.');

  return await getDB().rooms.findOne({ _id: roomId }); // room object or null
};

export const insertRoom = async (
  newRoomObj: Room,
  dbSession: ClientSession | null = null
): Promise<boolean> => {
  logQueryEvent('Inserting new room.');

  // Options object
  const options = dbSession ? { session: dbSession } : {};

  // Execute insert
  const result = await getDB().rooms.insertOne(newRoomObj, options);

  return result.acknowledged; // true or false
};

export const updateRoom = async (
  newRoomObj: Room
): Promise<{ matched: boolean; modified: boolean }> => {
  logQueryEvent('Updating the room info.');

  // Destructure roomId from newRoomObj and store the rest of the properties in roomData
  const { _id, ...roomData } = newRoomObj;

  const result = await getDB().rooms.updateOne({ _id: _id }, { $set: roomData });

  return {
    matched: result.matchedCount > 0,
    modified: result.modifiedCount > 0,
  }; // true or false
};

export const updateRoomAdmin = async (
  newAdminId: ObjectId,
  roomId: string,
  dbSession: ClientSession | null = null
): Promise<Room | null> => {
  logQueryEvent('Updating only the room admin in Room.');

  // Result will contain the updated or original (if no modification) document, or null if no document was found.
  return await getDB().rooms.findOneAndUpdate(
    // Filter
    { _id: roomId }, // find a room with roomId
    // Update
    { $set: { roomAdmin: newAdminId } }, // set the new admin
    // Option
    dbSession
      ? {
          returnDocument: ReturnDocument.AFTER,
          session: dbSession,
          includeResultMetadata: false,
        }
      : {
          returnDocument: ReturnDocument.AFTER,
          includeResultMetadata: false,
        } // return the updated document
  );
};

export const updateRoomStatus = async (
  roomId: string,
  newStatus: RoomStatusEnum,
  dbSession: ClientSession | null = null
): Promise<Room | null> => {
  logQueryEvent('Updating only the room status in Room.');

  // Result will contain the updated or original (if no modification) document, or null if no document was found.
  return await getDB().rooms.findOneAndUpdate(
    // Filter
    { _id: roomId }, // find a room with roomId
    // Update
    { $set: { status: newStatus } }, // set the new status
    // Option
    dbSession
      ? {
          returnDocument: ReturnDocument.AFTER,
          session: dbSession,
          includeResultMetadata: false,
        }
      : {
          returnDocument: ReturnDocument.AFTER,
          includeResultMetadata: false,
        } // return the updated document
  );
};

export const updateRoomSetting = async (
  roomId: string,
  newSetting: RoomSetting,
  dbSession: ClientSession | null = null
): Promise<Room | null> => {
  logQueryEvent('Updating only the room setting in Room.');

  // Result will contain the updated or original (if no modification) document, or null if no document was found.
  return await getDB().rooms.findOneAndUpdate(
    // Filter
    { _id: roomId }, // find a room with roomId
    // Update
    { $set: { setting: newSetting } }, // set the new status
    // Option
    dbSession
      ? {
          returnDocument: ReturnDocument.AFTER,
          session: dbSession,
          includeResultMetadata: false,
        }
      : {
          returnDocument: ReturnDocument.AFTER,
          includeResultMetadata: false,
        } // return the updated document
  );
};

export const deleteRoom = async (
  roomId: string,
  dbSession: ClientSession | null = null
): Promise<boolean> => {
  logQueryEvent('Deleting the room.');

  // Execute deletion
  const result = await getDB().rooms.deleteOne(
    // Filter
    { _id: roomId },
    // Option
    dbSession ? { session: dbSession } : {}
  );

  return result.deletedCount === 1; // true or false
};

export const getAllRooms = async (): Promise<Array<Room>> => {
  logQueryEvent('Fetching all rooms.');

  return await getDB().rooms.find({}).toArray(); // Array with elements or empty array
};

export const deleteAllRooms = async (): Promise<boolean> => {
  logQueryEvent('Deleting all rooms.');

  // Execute deletion
  const result = await getDB().rooms.deleteMany({});

  return result.deletedCount > 0; // true or false
};

export const cleanUpIdleRooms = () => {};
