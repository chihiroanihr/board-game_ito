import { ClientSession } from 'mongodb';

import { Room } from '@bgi/shared';

import { getDB } from '../dbConnect';
import { logQueryEvent } from '@debug';

export const getRoomInfo = async (roomId: string): Promise<Room | null> => {
  logQueryEvent('Fetching the room info.');

  try {
    return await getDB().rooms.findOne({ _id: roomId }); // room object or null
  } catch (error) {
    throw error;
  }
};

export const insertRoom = async (
  newRoomObj: Room,
  dbSession: ClientSession | null = null
): Promise<boolean> => {
  logQueryEvent('Inserting new room.');

  try {
    // Options object
    const options = dbSession ? { session: dbSession } : {};

    // Execute insert
    const result = await getDB().rooms.insertOne(newRoomObj, options);

    return result.acknowledged; // true or false
  } catch (error) {
    throw error;
  }
};

export const updateRoom = async (
  newRoomObj: Room
): Promise<{ matched: boolean; modified: boolean }> => {
  logQueryEvent('Updating the room info.');

  try {
    // Destructure roomId from newRoomObj and store the rest of the properties in roomData
    const { _id, ...roomData } = newRoomObj;

    const result = await getDB().rooms.updateOne({ _id: _id }, { $set: roomData });

    return {
      matched: result.matchedCount > 0,
      modified: result.modifiedCount > 0
    }; // true or false
  } catch (error) {
    throw error;
  }
};

export const deleteRoom = async (
  roomId: string,
  dbSession: ClientSession | null = null
): Promise<boolean> => {
  logQueryEvent('Deleting the room.');

  try {
    // Options object
    const options = dbSession ? { session: dbSession } : {};

    // Execute delete
    const result = await getDB().rooms.deleteOne({ _id: roomId }, options);

    return result.deletedCount === 1; // true or false
  } catch (error) {
    throw error;
  }
};

export const getAllRooms = async (): Promise<Array<Room>> => {
  logQueryEvent('Fetching all rooms.');

  try {
    return await getDB().rooms.find({}).toArray(); // Array with elements or empty array
  } catch (error) {
    throw error;
  }
};

export const deleteAllRooms = async (): Promise<boolean> => {
  logQueryEvent('Deleting all rooms.');

  try {
    const result = await getDB().rooms.deleteMany({});
    return result.deletedCount > 0; // true or false
  } catch (error) {
    throw error;
  }
};

export const cleanUpIdleRooms = () => {};
