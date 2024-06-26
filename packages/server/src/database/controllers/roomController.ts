import { ClientSession, ReturnDocument } from 'mongodb';

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

export const updateRoomStatus = async (
  roomId: string,
  newStatus: RoomStatusEnum,
  dbSession: ClientSession | null = null
): Promise<Room | null> => {
  logQueryEvent('Updating only the room status in Room.');

  // Options object
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

  // Result will contain the updated or original (if no modification) document,
  // or null if no document was found.
  return await getDB().rooms.findOneAndUpdate(
    { _id: roomId }, // Query part: find a room with roomId
    { $set: { status: newStatus } }, // Update part: set the new status
    options
  );
};

export const updateRoomSetting = async (
  roomId: string,
  newSetting: RoomSetting,
  dbSession: ClientSession | null = null
): Promise<Room | null> => {
  logQueryEvent('Updating only the room setting in Room.');

  // Options object
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

  // Result will contain the updated or original (if no modification) document,
  // or null if no document was found.
  return await getDB().rooms.findOneAndUpdate(
    { _id: roomId }, // Query part: find a room with roomId
    { $set: { setting: newSetting } }, // Update part: set the new status
    options
  );
};

export const deleteRoom = async (
  roomId: string,
  dbSession: ClientSession | null = null
): Promise<boolean> => {
  logQueryEvent('Deleting the room.');

  // Options object
  const options = dbSession ? { session: dbSession } : {};

  // Execute delete
  const result = await getDB().rooms.deleteOne({ _id: roomId }, options);

  return result.deletedCount === 1; // true or false
};

export const getAllRooms = async (): Promise<Array<Room>> => {
  logQueryEvent('Fetching all rooms.');

  return await getDB().rooms.find({}).toArray(); // Array with elements or empty array
};

export const deleteAllRooms = async (): Promise<boolean> => {
  logQueryEvent('Deleting all rooms.');

  const result = await getDB().rooms.deleteMany({});
  return result.deletedCount > 0; // true or false
};

export const cleanUpIdleRooms = () => {};
