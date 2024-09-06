import React, { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Avatar, Typography, Box, Stack } from '@mui/material';

import { type User, type Room, type Game, type InGameResponse, NamespaceEnum } from '@bgi/shared';

import { useSession, useAuth, useRoom, useGame, useSocket, useWindowDimensions } from '@/hooks';
import { outputServerError, getAvatarProps } from '@/utils';
import { type GameLayoutOutletContextType } from '../enum';

const Game = () => {
  const { adminId, players, activeSpeakers, synchronousBlock } =
    useOutletContext<GameLayoutOutletContextType>();
  const { socket } = useSocket();
  const { sessionId } = useSession();
  const { user: currentUser, updateUser } = useAuth();
  const { room, updateRoom } = useRoom();
  const { game, updateGame } = useGame();

  const { width, height } = useWindowDimensions();

  /**
   * First render: fetch game info via socket, and update game UI.
   */
  useEffect(() => {
    if (!sessionId) return;

    socket.emit(
      NamespaceEnum.IN_GAME,
      sessionId,
      async ({ error, user, room, game }: InGameResponse) => {
        // ERROR
        if (error || !user || !room || !game) {
          outputServerError(error);
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

  // const players = [
  //   { _id: '1', name: 'Player 1' },
  //   { _id: '2', name: 'Player 2' },
  //   { _id: '3', name: 'Player 3' },
  //   { _id: '4', name: 'Player 4' },
  //   { _id: '5', name: 'Player 4' },
  //   { _id: '6', name: 'Player 4' },
  //   { _id: '7', name: 'Player 4' },
  //   { _id: '8', name: 'Player 4' },
  //   { _id: '9', name: 'Player 4' },
  //   { _id: '10', name: 'Player 4' },
  // ];

  const MIN_CIRCLE_WIDTH = 300;
  const RADIUS = Math.min(Math.max(width, MIN_CIRCLE_WIDTH), height) / (4.5 - players.length / 4.5);
  // Calculate positions based on number of players
  const avatarPosition = (index: number, totalPlayers: number) => {
    const angle = (2 * Math.PI * index) / totalPlayers; // distribute equally in circle
    const x = Math.cos(angle) * RADIUS; // x position
    const y = Math.sin(angle) * RADIUS; // y position
    return { x, y };
  };

  // (1) choose theme card -> display to everyone

  // (2) distribute number cards

  // (3) player submit number cards from smallest to biggest

  // (4) if number cards in order -> success. If not -> fail.

  // Do not display the UI until game is fetched and updated via local storage.
  if (!game) return null;
  return (
    <Box position="relative" width={`${RADIUS * 2}px`} height={`${RADIUS * 2}px`}>
      {players.map((player: User, index: number) => {
        const { x, y } = avatarPosition(index, players.length);
        const isCurrentUser = player._id.toString() === currentUser._id.toString();

        return (
          // Player List (in circle)
          <Stack
            direction="column"
            justifyContent="center"
            alignItems="center"
            key={player._id.toString()}
            position="absolute"
            left={`${x + RADIUS}px`} // Adjust position relative to center
            top={`${y + RADIUS}px`}
            sx={{
              transform: 'translate(-50%, -50%)', // Center the avatar
            }}
          >
            {isCurrentUser ? (
              <Typography component="span" variant="caption" fontWeight="bold">
                YOU
              </Typography>
            ) : (
              <Typography
                component="span"
                variant="caption"
                lineHeight={1.2}
                textAlign="center"
                whiteSpace="nowrap"
                maxWidth="4.2rem"
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {player.name}
              </Typography>
            )}
            <Avatar {...getAvatarProps(player.name)} />

            {activeSpeakers.map((speakerId: string) => (
              <div key={speakerId}>
                {players.find((player: User) => player._id.toString() === speakerId)?.name}
              </div>
            ))}
          </Stack>
        );
      })}
    </Box>
  );
  {
    /* <div>adminId: {adminId?.toString()}</div> */
  }
};

export default Game;
