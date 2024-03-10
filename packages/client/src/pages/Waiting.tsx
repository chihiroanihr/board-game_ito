import React, { useEffect, useState } from 'react';
import { ObjectId } from 'mongodb';
import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Stack,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText
} from '@mui/material';

import type { User, Room } from '@bgi/shared';

import {
  BadgeOnline,
  AnimateTextThreeDots,
  SnackbarPlayerIn,
  SnackbarPlayerOut
} from '@/components';
import { useAuth, useRoom, useSocket } from '@/hooks';
import { outputServerError, outputResponseTimeoutError, stringAvatar } from '@/utils';

type SocketEventType = {
  user: User;
  room: Room;
};

export default function Waiting() {
  const { socket } = useSocket();
  const { user: myself } = useAuth();
  const { room, updateRoom } = useRoom();

  const [adminId, setAdminId] = useState<ObjectId>();
  const [players, setPlayers] = useState<Array<User>>([]);
  const [playerIn, setPlayerIn] = useState<User | undefined>();
  const [playerOut, setPlayerOut] = useState<User | undefined>();

  const [loading, setLoading] = useState<boolean>(false);
  const [allowStart, setAllowStart] = useState<boolean>(false);

  /**
   * [1] Myself arrives
   * ---------------------------------------------------
   * Assume room info and user info in the local storage are already updated previously.
   * 1. If you are a room admin:
   *    - Receive new room info (Room obj), list of players (Array<User>), and user (myself) info (User obj) from the response
   *    - Set admin ID (your user ID)
   *    - Include yourself (User obj) in the list of players (Array<User>)
   * 2. If you are a participant:
   *    - Receive new room info (Room obj), list of players (Array<User>), and user (myself) info (User obj) from the response
   *    - Set admin ID (room.createdBy)
   *    - Set list of participating players (Array<User>)
   *    - (Set other room config info, etc.)
   */
  useEffect(() => {
    room &&
      socket.emit('wait-room', room, async (error: unknown, responsePlayers: Array<User>) => {
        if (error) {
          outputServerError({ error });
        } else {
          // Add admin
          setAdminId(room.createdBy);
          // Add list of players
          setPlayers(responsePlayers);
        }
      });
  }, [room, socket]);

  /**
   * [2] New user arrives
   * ---------------------------------------------------
   * - Receive new room info (Room obj), list of players (Array<User>), and user (participated) info (User obj) from the response
   * - Update room info in the local storage
   * - Append new user to the list of players (just replace oroginal list of players with new list of players received)
   * - If list of players reaches more than 4, enable "allowStart"
   * - Display message that new user has arrived
   */
  useEffect(() => {
    async function onNewPlayerArriveEvent(data: SocketEventType) {
      const { user: player, room } = data;

      // Update room in the local storage first
      updateRoom(room);
      // Add new player in the list of players
      setPlayers((prevPlayers: User[]) => [...prevPlayers, player]);
      // Store new player
      setPlayerIn(player);

      // Enable start button if more than 4 players
      if (players.length >= 4) {
        setAllowStart(true);
      }
    }

    // Runs whenever a socket event is recieved from the server
    socket.on('new-player', onNewPlayerArriveEvent);
    return () => {
      socket.off('new-player', onNewPlayerArriveEvent);
    };
  }, [players, socket, updateRoom]);

  /**
   * [3] Myself leaves
   * ---------------------------------------------------
   * Nothing specific to do.
   */

  /**
   * [4] Other participant leaves
   * ---------------------------------------------------
   * - Receive new room (Room obj), list of players (Array<User>), and user (left) info (User obj) from the response
   * - Update room info in the local storage
   * - Remove the user from the list of players (just replace original list of players with new list of players received)
   * - If list of players decreases to less than 4, disable "allowStart"
   * - Check if the player left was an admin (from the new room info received)
   * 1. If the participant was a room admin:
   *    - Set new room admin ID (room.createdBy)
   *    - Display message that new user has left & admin has changed
   * 2. Else:
   *    - Display message that new user has left
   */
  useEffect(() => {
    async function onPlayerLeaveEvent(data: SocketEventType) {
      // Disable start button if less than 4 players
      if (players.length <= 4) {
        setAllowStart(false);
      }

      const { user: player, room } = data;

      // Update room in the local storage first
      updateRoom(room);
      // If admin changed then set new admin
      if (room.createdBy.toString() !== adminId?.toString()) {
        setAdminId(room.createdBy);
      }
      // Remove player from the list of players
      setPlayers((prevPlayers: User[]) =>
        prevPlayers.filter(
          (prevPlayer: User) => prevPlayer._id.toString() !== player._id.toString()
        )
      );
      // Store player left
      setPlayerOut(player);
    }

    // Runs whenever a socket event is recieved from the server
    socket.on('player-left', onPlayerLeaveEvent);
    return () => {
      socket.off('player-left', onPlayerLeaveEvent);
    };
  }, [adminId, players, socket, updateRoom]);

  /**
   * Start game
   */
  const handleStartGame = () => {
    setLoading(true);

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      setLoading(false);
      outputResponseTimeoutError();
    }, 5000);

    // Send to socket
    socket.emit('start-game', room, async (error: unknown, response: unknown) => {
      // socket.emit("start-game", room);

      // Clear the timeout as response is received before timeout
      clearTimeout(timeoutId);

      if (error) {
        outputServerError({ error });
      } else {
        // Navigate to start game
      }

      setLoading(false);
    });
  };

  if (!room) return null;
  return (
    <Box display="flex" flexDirection="column" alignItems="flex-start" gap={4}>
      <Stack direction="column" spacing={0.5}>
        <Typography variant="h4" component="h2">
          Room ID:{' '}
          <Typography variant="inherit" fontWeight="bold" component="span">
            {room._id}
          </Typography>
        </Typography>
        <Typography variant="body1" component="div">
          Invite other players with this room ID.
        </Typography>
      </Stack>

      <Stack direction="column" spacing={1}>
        <Typography variant="body1" component="div">
          Waiting for other players <AnimateTextThreeDots />
        </Typography>

        <List>
          {players.map((player, index) => (
            <ListItem key={player._id.toString()}>
              <ListItemAvatar>
                <BadgeOnline
                  variant="dot"
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                  <Avatar {...stringAvatar(player.name)} />
                </BadgeOnline>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography component="div">
                    {player.name}
                    {adminId?.toString() === player._id.toString() && (
                      <Typography component="span" fontWeight="bold">
                        {' '}
                        (admin)
                      </Typography>
                    )}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </Stack>

      <SnackbarPlayerIn
        open={!!playerIn}
        player={playerIn}
        onClose={() => setPlayerIn(undefined)}
      />
      <SnackbarPlayerOut
        open={!!playerOut}
        player={playerOut}
        onClose={() => setPlayerOut(undefined)}
      />

      {adminId?.toString() === myself?._id.toString() && (
        <>
          {!allowStart && (
            <Typography component="p">
              You need to have{' '}
              <Typography component="span" fontWeight="bold">
                {4 - players.length}
              </Typography>{' '}
              more players to begin the game.
            </Typography>
          )}

          {players.length >= 10 && (
            <Typography component="p">
              You have reached maximum number of players. Please start the game.
            </Typography>
          )}

          <Button
            variant="contained"
            onClick={handleStartGame}
            disabled={!allowStart || loading}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
          >
            {loading ? 'Loading...' : 'Start Game'}
          </Button>
        </>
      )}
    </Box>
  );
}
