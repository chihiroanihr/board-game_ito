import React, { useEffect, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { ObjectId } from 'mongodb';
import {
  Typography,
  Button,
  Stack,
  List,
  Dialog,
  DialogTitle,
  DialogActions,
  Backdrop,
  CircularProgress,
  useMediaQuery,
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
  SnackbarPlayer,
} from '@/components';
import {
  useAuth,
  useRoom,
  useAction,
  useSubmissionStatus,
  type BeforeSubmitCallbackParams,
  type BeforeSubmitCallbackFunction,
  type ErrorCallbackParams,
  type ErrorCallbackFunction,
  type SuccessCallbackParams,
  type SuccessCallbackFunction,
  useSocket,
} from '@/hooks';
import { outputServerError } from '@/utils';
import { type SnackbarPlayerInfoType } from '../enum';

export default function Waiting() {
  const { socket } = useSocket();
  const { user: myself } = useAuth();
  const { room, updateRoom } = useRoom();
  const { isSubmitting } = useSubmissionStatus();

  const theme = useTheme();
  const isLgViewport = useMediaQuery(theme.breakpoints.up('lg')); // boolean

  const [adminId, setAdminId] = useState<ObjectId>();
  const [players, setPlayers] = useState<Array<User>>([]);
  const [allowStart, setAllowStart] = useState<boolean>(false);
  const [synchronousBlock, setSynchronousBlock] = useState<boolean>(false); // Block other execution synchronously until state sets back to true (loading state just for consistent execution

  const [backdropOpen, setBackdropOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarPlayerInfo, setSnackbarPlayerInfo] = useState<SnackbarPlayerInfoType>(undefined);
  const [playerSnackbars, setPlayerSnackbars] = React.useState<readonly SnackbarPlayerInfoType[]>(
    []
  );

  const isAdmin = !!(adminId?.toString() === myself?._id.toString());

  // When back button pressed (https://reactrouter.com/en/6.22.3/hooks/use-blocker)
  const blocker = useBlocker(({ historyAction }) => historyAction === 'POP');

  // Callback for button click handlers
  const beforeSubmit: BeforeSubmitCallbackFunction = ({ action }: BeforeSubmitCallbackParams) => {
    if (action && action === NamespaceEnum.START_GAME) {
      setBackdropOpen(true);
    }
  };
  const onError: ErrorCallbackFunction = ({ action }: ErrorCallbackParams) => {
    if (action && action === NamespaceEnum.START_GAME) {
      setBackdropOpen(false);
    }
  };
  const onSuccess: SuccessCallbackFunction = ({ action }: SuccessCallbackParams) => {
    if (action && action === NamespaceEnum.START_GAME) {
      setBackdropOpen(false);
    }
  };

  // Button click handlers
  const { handleLeaveRoom, handleStartGame, loadingButton } = useAction({
    beforeSubmit,
    onError,
    onSuccess,
  });

  // Snackbar handlers
  const handleSnackbarOpen = () => setSnackbarOpen(true);
  const handleSnackbarClose = () => setSnackbarOpen(false);
  const handleSnackbarExited = () => setSnackbarPlayerInfo(undefined);

  // Enabling start game depending on player number
  useEffect(() => {
    // Enable start button if more than MIN_NUM_PLAYERS players
    if (players.length >= MIN_NUM_PLAYERS) {
      setAllowStart(true);
    } else {
      setAllowStart(false);
    }
  }, [players.length]);

  // Consecutive snackbars (multiple snackbars without stacking them): (https://mui.com/material-ui/react-snackbar/#consecutive-snackbars)
  useEffect(() => {
    // Set a new snack when we don't have an active one
    if (playerSnackbars.length && !snackbarPlayerInfo) {
      setSnackbarPlayerInfo(playerSnackbars[0]);
      setPlayerSnackbars((prev) => prev.slice(1));
      handleSnackbarOpen();
    }
    // Close an active snack when a new one is added
    else if (playerSnackbars.length && snackbarPlayerInfo && snackbarOpen) {
      handleSnackbarClose();
    }
  }, [playerSnackbars, snackbarOpen, snackbarPlayerInfo]);

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
    async function onPlayerInEvent({ user: player, room }: PlayerInResponse) {
      setSynchronousBlock(true); // Block other execution for consistency / synchronous (to make sure data is stored before action)

      // Update room in the local storage first
      updateRoom(room);
      // Add new player in the list of players
      setPlayers((prevPlayers: User[]) => [...prevPlayers, player]);
      // Store player and snackbar info for snackbar notification + Add to snackbar queue
      setPlayerSnackbars((prev) => [
        ...prev,
        {
          key: new Date().getTime(),
          player: player,
          status: 'in',
        },
      ]);

      setSynchronousBlock(false); // Unblock
    }

    // Executes whenever a socket event is recieved from the server
    socket.on(NamespaceEnum.PLAYER_IN, onPlayerInEvent);
    return () => {
      socket.off(NamespaceEnum.PLAYER_IN, onPlayerInEvent);
    };
  }, [socket, updateRoom]);

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
    async function onPlayerOutEvent({ user: player, room }: PlayerOutResponse) {
      setSynchronousBlock(true); // Block other execution for consistency / synchronous (to make sure data is stored before action)

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
      // Store player and snackbar info for snackbar notification + Add to snackbar queue
      setPlayerSnackbars((prev) => [
        ...prev,
        {
          key: new Date().getTime(),
          player: player,
          status: 'out',
        },
      ]);
    }

    setSynchronousBlock(false); // Unblock

    // Executes whenever a socket event is recieved from the server
    socket.on(NamespaceEnum.PLAYER_OUT, onPlayerOutEvent);
    return () => {
      socket.off(NamespaceEnum.PLAYER_OUT, onPlayerOutEvent);
    };
  }, [adminId, socket, updateRoom]);

  const PlayerList = () => {
    return (
      <List id="waiting_player-list" dense={true} sx={{ overflowY: 'auto' }}>
        {players.map((player) => (
          <PlayerListItem key={player._id.toString()} player={player} adminId={adminId} />
        ))}
      </List>
    );
  };

  const RoomIdDisplay = () => {
    return (
      <Stack
        id="waiting_id-display_wrapper"
        spacing="0.25rem"
        bgcolor="grey.200"
        p={{ xs: '1.4rem', lg: '2rem' }}
        border={2}
        borderColor="grey.300"
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
    );
  };

  const PlayerWaitingCaption = () => {
    return (
      <Stack id="waiting_other-info_wrapper" spacing={0} alignItems="flex-start" width={'100%'}>
        <Typography variant="body1" component="div">
          Waiting for other players <AnimateTextThreeDots />
        </Typography>

        <Typography component="p">
          <Typography component="span" fontWeight="bold" color="error">
            {!allowStart ? MIN_NUM_PLAYERS - players.length : 0}{' '}
          </Typography>
          more players required to begin the game.
        </Typography>

        {players.length >= MAX_NUM_PLAYERS && (
          <Typography component="p">
            Maximum number of players reached. Please start the game.
          </Typography>
        )}
      </Stack>
    );
  };

  const StartGameButton = () => {
    return (
      <Stack
        id="waiting_start-game_wrapper"
        spacing="0.25rem"
        alignItems="center"
        alignSelf="center"
      >
        {!isAdmin && (
          <Typography variant="body2" component="div" color="grey.500" fontSize="0.7rem">
            Waiting for admin to start the game.
          </Typography>
        )}
        <TextButtonStyled
          onClick={handleStartGame}
          variant="contained"
          loading={loadingButton}
          loadingElement="Loading..."
          disabled={!isAdmin || !allowStart || !synchronousBlock} // Only admin can start the game
        >
          Start Game
        </TextButtonStyled>
      </Stack>
    );
  };

  if (!room) return null;
  return (
    <>
      {isLgViewport ? (
        // Large Viewport
        <Stack direction="row" gap={{ xs: '1.4rem', lg: '2rem' }} width="100%" height="100%">
          {/* Players List */}
          <Stack
            id="waiting_player-list_wrapper"
            width="100%"
            border="2px solid"
            borderColor="grey.300"
          >
            <PlayerList />
          </Stack>

          <Stack id="waiting_info-action_wrapper" justifyContent="space-between" width="100%">
            <Stack direction="column" spacing="1rem">
              {/* Room ID display */}
              <RoomIdDisplay />

              {/* Description */}
              <PlayerWaitingCaption />
            </Stack>

            {/* Start Game Button */}
            <StartGameButton />
          </Stack>
        </Stack>
      ) : (
        // Small Viewport
        <Stack
          id="waiting_info-action_wrapper"
          direction="column"
          // gap={{ xs: '1.4rem', lg: '2rem' }}
          justifyContent="space-between"
          width="100%"
          height="100%"
        >
          <Stack
            direction="column"
            gap={{ xs: '1.4rem', lg: '2rem' }}
            height="100%"
            mb="2rem"
            sx={{ overflowY: 'auto' }}
          >
            {/* Room ID display */}
            <RoomIdDisplay />

            {/* Players List */}
            <Stack
              id="waiting_player-list_wrapper"
              width="100%"
              border="2px solid"
              borderColor="grey.300"
              sx={{ overflowY: 'auto' }}
            >
              <PlayerList />
            </Stack>

            {/* Description */}
            <PlayerWaitingCaption />
          </Stack>

          {/* Start Game Button */}
          <StartGameButton />
        </Stack>
      )}

      {/* Snackbar player in / out notification */}
      <SnackbarPlayer
        open={snackbarOpen}
        snackbarInfo={snackbarPlayerInfo}
        onClose={handleSnackbarClose}
        onExited={handleSnackbarExited}
      />

      {/* Dialog before leaving (press back button) */}
      <Dialog id="waiting_before-leave_dialog" open={blocker.state === 'blocked'}>
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

      <Backdrop
        sx={{ color: 'primary.main', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={backdropOpen}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}

// LIST
// sx={{
//   display: 'grid',
//   ...(players.length > MAX_NUM_PLAYERS / 2 && {
//     gridTemplateRows: `repeat(${Math.floor(MAX_NUM_PLAYERS / 2) + (MAX_NUM_PLAYERS % 2)}, 1fr)`,
//     gridAutoFlow: 'column',
//   }),
// }}
