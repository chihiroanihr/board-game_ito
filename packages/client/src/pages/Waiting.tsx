import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Typography,
  Stack,
  List,
  Backdrop,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { People as PeopleIcon } from '@mui/icons-material';

import {
  MIN_NUM_PLAYERS,
  MAX_NUM_PLAYERS,
  type User,
  type ChangeAdminResponse,
  type CreateGameResponse,
  NamespaceEnum,
} from '@bgi/shared';

import { TextButton, AnimateTextThreeDots, PlayerListItem, TooltipStyled } from '@/components';
import { useAuth, useRoom, usePreFormSubmission, useSocket } from '@/hooks';
import { navigateGame, outputServerError, outputResponseTimeoutError } from '@/utils';
import { type GameLayoutOutletContextType } from '../enum';

export default function Waiting() {
  const { adminId, players, activeSpeakers, synchronousBlock } =
    useOutletContext<GameLayoutOutletContextType>();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user: currentUser } = useAuth();
  const { room } = useRoom();
  const { loadingButton, processPreFormSubmission } = usePreFormSubmission();

  const theme = useTheme();
  const isLgViewport = useMediaQuery(theme.breakpoints.up('lg')); // boolean

  const [allowStart, setAllowStart] = useState<boolean>(false);
  const [backdropOpen, setBackdropOpen] = useState(false);

  const isAdmin = !!(adminId?.toString() === currentUser?._id.toString());

  // Enabling start game depending on player number
  useEffect(() => {
    // Enable start button if more than MIN_NUM_PLAYERS players
    if (players.length >= MIN_NUM_PLAYERS) {
      setAllowStart(true);
    } else {
      setAllowStart(false);
    }
  }, [players.length]);

  /**
   * Handler for changing admin.
   * @returns
   */
  const handleChangeAdmin = (newAdmin: User) => {
    processPreFormSubmission(true);

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      processPreFormSubmission(false);
      // ERROR
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit(NamespaceEnum.CHANGE_ADMIN, newAdmin, async ({ error }: ChangeAdminResponse) => {
      clearTimeout(timeoutId);

      // ERROR
      if (error) {
        outputServerError(error);
      }

      processPreFormSubmission(false);
    });
  };

  /**
   * Handler for creating (initializing) game.
   */
  const handleStartGame = () => {
    processPreFormSubmission(true);

    /** @socket_send - Create new game record & update room info */
    socket.emit(NamespaceEnum.CREATE_GAME, async ({ error }: CreateGameResponse) => {
      // ERROR
      if (error) outputServerError(error);
      // SUCCESS
      processPreFormSubmission(false);
    });
  };

  useEffect(() => {
    async function onGameCreating() {
      setBackdropOpen(true);
    }
    // Executes whenever a socket event is received from the server
    socket.on(NamespaceEnum.GAME_CREATING, onGameCreating);
    return () => {
      socket.off(NamespaceEnum.GAME_CREATING, onGameCreating);
    };
  }, [socket]);

  useEffect(() => {
    async function onGameCreateFailed() {
      setBackdropOpen(false);
    }
    // Executes whenever a socket event is received from the server
    socket.on(NamespaceEnum.GAME_CREATE_FAILED, onGameCreateFailed);
    return () => {
      socket.off(NamespaceEnum.GAME_CREATE_FAILED, onGameCreateFailed);
    };
  }, [socket]);

  /**
   * Admin has started game.
   */
  useEffect(() => {
    async function onGameCreatedEvent() {
      navigateGame(navigate); // Navigate to game page
      setBackdropOpen(false);
    }

    // Executes whenever a socket event is received from the server
    socket.on(NamespaceEnum.GAME_CREATED, onGameCreatedEvent);
    return () => {
      socket.off(NamespaceEnum.GAME_CREATED, onGameCreatedEvent);
    };
  }, [navigate, socket]);

  const PlayersNumber = () => {
    return (
      <Stack
        direction="row"
        justifyContent="end"
        alignItems="center"
        gap="0.25rem"
        px="0.5rem"
        py="0.2rem"
        bgcolor="grey.200"
        borderBottom="1.2px solid"
        borderColor="grey.300"
      >
        <PeopleIcon color="primary" />
        <Stack display="inline-flex" direction="row" alignItems="baseline" gap="0.15rem">
          <Typography variant="body1" component="div" fontWeight={600}>
            {players.length}
          </Typography>
          <Typography
            variant="body2"
            component="div"
            fontSize="0.65rem"
            fontWeight={500}
            textTransform="uppercase"
          >
            {players.length <= 1 ? 'player' : 'players'}
          </Typography>
        </Stack>
      </Stack>
    );
  };

  const PlayersList = () => {
    return (
      <List id="waiting_player-list" dense={true} sx={{ overflowY: 'auto' }} disablePadding>
        {players.map((player: User) => (
          <PlayerListItem
            key={player._id.toString()}
            player={player}
            adminId={adminId}
            currentUserId={currentUser?._id}
            handleChangeAdmin={handleChangeAdmin}
          />
        ))}
      </List>
    );
  };

  const RoomIdDisplay = () => {
    const handleRoomIdCopy = () => {
      navigator.clipboard.writeText(room._id).then(
        () => {
          alert('Room ID copied to clipboard!');
        },
        (err) => {
          console.error('Could not copy Room ID to your clipboard: ', err);
        }
      );
    };

    return (
      <Stack
        id="waiting_id-display_wrapper"
        spacing="0.4rem"
        bgcolor="grey.200"
        p={{ xs: '1.4rem', lg: '2rem' }}
        border={2}
        borderColor="grey.300"
      >
        <Typography variant="h4" component="h2">
          Room ID:{' '}
          <TooltipStyled title="Click to copy" placement="right">
            <Typography
              variant="inherit"
              component="span"
              fontWeight="bold"
              color="primary.contrastText"
              bgcolor="grey.600"
              paddingY="0.2rem"
              paddingX="0.5rem"
              sx={{ cursor: 'pointer' }}
              onClick={handleRoomIdCopy}
            >
              {room._id}
            </Typography>
          </TooltipStyled>
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
        <TextButton
          onClick={handleStartGame}
          variant="contained"
          loading={loadingButton}
          loadingElement="Loading..."
          sx={{ fontWeight: 600 }}
          disabled={!isAdmin || !allowStart || synchronousBlock} // Only admin can start the game
        >
          Start Game
        </TextButton>
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
            <PlayersNumber />
            <PlayersList />
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
          justifyContent="space-between"
          width="100%"
          height="100%"
        >
          <Stack
            direction="column"
            gap={{ xs: '1.4rem', lg: '2rem' }}
            height="100%"
            mb="3rem"
            sx={{ overflowY: 'auto' }}
          >
            {/* Room ID display */}
            <RoomIdDisplay />

            {/* Players List */}
            <Stack
              id="waiting_player-list_wrapper"
              width="100%"
              height="100%"
              minHeight="30vh"
              border="2px solid"
              borderColor="grey.300"
              sx={{ overflowY: 'auto' }}
            >
              <PlayersNumber />
              <PlayersList />
            </Stack>

            {/* Description */}
            <PlayerWaitingCaption />
          </Stack>

          {/* Start Game Button */}
          <StartGameButton />
        </Stack>
      )}

      {/* Backdrop when game start button is pressed */}
      <Backdrop
        open={backdropOpen}
        sx={{ color: 'common.white', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <CircularProgress color="inherit" size="3rem" />
      </Backdrop>

      {activeSpeakers.map((speakerId: string) => (
        <div key={speakerId}>
          {players.find((player: User) => player._id.toString() === speakerId)?.name}
        </div>
      ))}
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
