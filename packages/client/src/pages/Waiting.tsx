import React, { useEffect, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { ObjectId } from 'mongodb';
import {
  Typography,
  Box,
  Stack,
  List,
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
  useTheme,
} from '@mui/material';

import {
  type User,
  type WaitRoomResponse,
  type PlayerInResponse,
  type PlayerOutResponse,
  NamespaceEnum,
  MIN_NUM_PLAYERS,
  MAX_NUM_PLAYERS,
} from '@bgi/shared';

import {
  TextButtonStyled,
  AnimateTextThreeDots,
  PlayerListItem,
  SnackbarPlayerIn,
  SnackbarPlayerOut,
} from '@/components';
import {
  useAuth,
  useRoom,
  useAction,
  useSubmissionStatus,
  type BeforeSubmitCallbackFunction,
  type ErrorCallbackParams,
  type ErrorCallbackFunction,
  type SuccessCallbackParams,
  type SuccessCallbackFunction,
  useSocket,
} from '@/hooks';
import { outputServerError } from '@/utils';

export default function Waiting() {
  const theme = useTheme();

  const { socket } = useSocket();
  const { user: myself } = useAuth();
  const { room, updateRoom } = useRoom();
  const { isSubmitting } = useSubmissionStatus();

  const [adminId, setAdminId] = useState<ObjectId>();
  const [players, setPlayers] = useState<Array<User>>([]);
  const [playerIn, setPlayerIn] = useState<User | undefined>();
  const [playerOut, setPlayerOut] = useState<User | undefined>();
  const [allowStart, setAllowStart] = useState<boolean>(false);

  // When back button pressed (https://reactrouter.com/en/6.22.3/hooks/use-blocker)
  const blocker = useBlocker(({ historyAction }) => historyAction === 'POP');

  // Callback for button click handlers
  const beforeSubmit: BeforeSubmitCallbackFunction = () => {};
  const onError: ErrorCallbackFunction = ({ message }: ErrorCallbackParams) => {};
  const onSuccess: SuccessCallbackFunction = ({ action }: SuccessCallbackParams) => {};

  // Button click handlers
  const { handleLeaveRoom, handleStartGame, loadingButton } = useAction({
    beforeSubmit,
    onError,
    onSuccess,
  });

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
      socket.emit(NamespaceEnum.WAIT_ROOM, room, async ({ error, players }: WaitRoomResponse) => {
        if (error) {
          outputServerError({ error });
        } else if (!players) {
          /** @todo - Failed to fetch players error (create new error) */
        } else {
          // Add admin
          setAdminId(room.createdBy);
          // Add list of players
          setPlayers(players);
        }
      });
  }, [room, socket]);

  /**
   * [2] New user arrives
   * ---------------------------------------------------
   * - Receive new room info (Room obj), list of players (Array<User>), and user (participated) info (User obj) from the response
   * - Update room info in the local storage
   * - Append new user to the list of players (just replace oroginal list of players with new list of players received)
   * - If list of players reaches more than MIN_NUM_PLAYERS, enable "allowStart"
   * - Display message that new user has arrived
   */
  useEffect(() => {
    async function onPlayerInEvent(data: PlayerInResponse) {
      const { user: player, room } = data;

      // Update room in the local storage first
      updateRoom(room);
      // Add new player in the list of players
      setPlayers((prevPlayers: User[]) => [...prevPlayers, player]);
      // Store new player
      setPlayerIn(player);

      // Enable start button if more than MIN_NUM_PLAYERS players
      if (players.length >= MIN_NUM_PLAYERS) {
        setAllowStart(true);
      }
    }

    // Executes whenever a socket event is recieved from the server
    socket.on(NamespaceEnum.PLAYER_IN, onPlayerInEvent);
    return () => {
      socket.off(NamespaceEnum.PLAYER_IN, onPlayerInEvent);
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
   * - If list of players decreases to less than MIN_NUM_PLAYERS, disable "allowStart"
   * - Check if the player left was an admin (from the new room info received)
   * 1. If the participant was a room admin:
   *    - Set new room admin ID (room.createdBy)
   *    - Display message that new user has left & admin has changed
   * 2. Else:
   *    - Display message that new user has left
   */
  useEffect(() => {
    async function onPlayerOutEvent(data: PlayerOutResponse) {
      // Disable start button if less than MIN_NUM_PLAYERS players
      if (players.length <= MIN_NUM_PLAYERS) {
        setAllowStart(false);
      }

      const { user: player, room } = data;

      // Update room in the local storage first
      updateRoom(room);
      // If room still exists (at least one player left in the room) AND If admin changed then set new admin
      if (room && room.createdBy.toString() !== adminId?.toString()) {
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

    // Executes whenever a socket event is recieved from the server
    socket.on(NamespaceEnum.PLAYER_OUT, onPlayerOutEvent);
    return () => {
      socket.off(NamespaceEnum.PLAYER_OUT, onPlayerOutEvent);
    };
  }, [adminId, players, socket, updateRoom]);

  if (!room) return null;
  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        flexGrow={1}
        gap={4}
        width={'100%'}
      >
        <Stack gap={4}>
          {/* Room ID display */}
          <Stack
            spacing={0.5}
            bgcolor={theme.palette.grey[300]}
            width={'100%'}
            p={3}
            border={0.5}
            borderRadius={1.5}
            borderColor={theme.palette.grey[400]}
          >
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

          {/* Description */}
          <Stack direction="column" spacing={2}>
            <Stack spacing={0} alignItems="flex-start" width={'100%'}>
              <Typography variant="body1" component="div">
                Waiting for other players <AnimateTextThreeDots />
              </Typography>

              {!allowStart && (
                <Typography component="p">
                  <Typography component="span" fontWeight="bold">
                    {MIN_NUM_PLAYERS - players.length}
                  </Typography>{' '}
                  more players required to begin the game.
                </Typography>
              )}

              {players.length >= MAX_NUM_PLAYERS && (
                <Typography component="p">
                  Maximum number of players reached. Please start the game.
                </Typography>
              )}
            </Stack>

            {/* Players List */}
            <List
              sx={{
                display: 'grid',
                ...(players.length > MAX_NUM_PLAYERS / 2 && {
                  gridTemplateRows: `repeat(${Math.floor(MAX_NUM_PLAYERS / 2) + (MAX_NUM_PLAYERS % 2)}, 1fr)`,
                  gridAutoFlow: 'column',
                }),
              }}
            >
              {players.map((player) => (
                <PlayerListItem key={player._id.toString()} player={player} adminId={adminId} />
              ))}
            </List>
          </Stack>
        </Stack>

        {/* Start Game Button */}
        <Stack spacing={0.5} alignItems="center" alignSelf="center">
          {adminId?.toString() !== myself?._id.toString() && (
            <Typography variant="body2" component="div" color="grey.500">
              Only admin can start the game.
            </Typography>
          )}
          <TextButtonStyled
            onClick={handleStartGame}
            variant="contained"
            loading={loadingButton}
            disabled={adminId?.toString() !== myself?._id.toString() || !allowStart} // Only admin can start the game
          >
            Start Game
          </TextButtonStyled>
        </Stack>
      </Box>

      {/* Snackbar player in / out notification */}
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

      {/* Dialog before leaving (press back button) */}
      <Dialog open={blocker.state === 'blocked'}>
        <DialogTitle>Are you sure you want to leave?</DialogTitle>
        <DialogActions>
          {/* No need of blocker.proceed?.() as handleLeaveRoom() automatically redirects */}
          <Button onClick={() => blocker.reset?.()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleLeaveRoom} disabled={isSubmitting}>
            Proceed
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
