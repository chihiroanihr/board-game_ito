import { ClientSession, ObjectId } from 'mongodb';

import { type Room, type Game, type Round, RoomStatusEnum, GameRoundStatusEnum } from '@bgi/shared';

import * as controller from '../controllers';
import * as log from '../../log';

export const handleCreateGame = async (
  roomId: string,
  dbSession: ClientSession | null = null
): Promise<{ room: Room; game: Game }> => {
  try {
    /** @api_call - Update room status (PUT) */
    const updatedRoom = await controller.updateRoomStatus(
      roomId,
      RoomStatusEnum.PLAYING,
      dbSession
    );
    if (!updatedRoom)
      // Error
      throw new Error("Failed to update room's status (given room might not exist).");

    // Create a new round object
    const firstRoundObj: Round = {
      _id: new ObjectId(),
      roundNumber: 1,
      theme: null,
      themeChosenBy: null,
      playerCards: [],
      status: GameRoundStatusEnum.PENDING,
    };

    // Create a new game object
    const newGameObj: Game = {
      _id: new ObjectId(),
      roomId: roomId,
      rounds: [firstRoundObj],
      cardsAvailable: Array.from({ length: 100 }, (_, i) => i + 1), // Create an array of number cards (from 1 to 100)
      startTime: new Date(),
      endTime: null, // End time will be set when the game ends
    };

    /** @api_call - Upsert new game info to database (POST & PUT) */
    const upsertGame = await controller.upsertGame(newGameObj, dbSession);
    // Error
    if (!upsertGame) {
      throw new Error('Failed to insert new game (there might be duplicates in the database).');
    }

    // All success
    return { room: updatedRoom, game: upsertGame };
  } catch (error) {
    throw log.handleDBError(error, 'handleCreateGame');
  }
};
