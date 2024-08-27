import React, { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

import { type User, type Room, type Game, type InGameResponse, NamespaceEnum } from '@bgi/shared';

import { useSession, useAuth, useRoom, useGame, useSocket } from '@/hooks';
import { outputServerError } from '@/utils';
import { type GameLayoutOutletContextType } from '../enum';

const Game = () => {
  const { adminId, players, synchronousBlock } = useOutletContext<GameLayoutOutletContextType>();
  const { socket } = useSocket();
  const { sessionId } = useSession();
  const { user: currentUser, updateUser } = useAuth();
  const { room, updateRoom } = useRoom();
  const { game, updateGame } = useGame();

  useEffect(() => {
    if (!sessionId) return;

    socket.emit(
      NamespaceEnum.IN_GAME,
      sessionId,
      async ({ error, user, room, game }: InGameResponse) => {
        // ERROR
        if (error || !user || !room || !game) {
          outputServerError({ error });
        }
        // SUCCESS
        else {
          // Update local storage
          updateUser(user);
          updateRoom(room);
          updateGame(game);
        }
      }
    );
  }, [sessionId, socket, updateGame, updateRoom, updateUser]);

  // Do not display the UI until game is fetched and updated via local storage.
  if (!game) return null;
  return (
    <div>
      <div>adminId: {adminId?.toString()}</div>
      {players.map((player: User) => (
        <div key={player._id.toString()}>{player.name}</div>
      ))}
    </div>
  );
};

export default Game;
