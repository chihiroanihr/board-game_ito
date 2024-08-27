import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ObjectId } from 'mongodb';

import {
  type User,
  type FetchPlayersResponse,
  type PlayerInResponse,
  type PlayerOutResponse,
  NamespaceEnum,
} from '@bgi/shared';

import { SnackbarPlayerInQueue } from '@/components';
import { useRoom, useSocket } from '@/hooks';
import { outputServerError } from '@/utils';
import { PlayerInQueueActionEnum, type SnackbarPlayerInQueueInfoType } from '../enum';

const GameLayout = () => {
  const { socket } = useSocket();
  const { room, updateRoom } = useRoom();

  const [adminId, setAdminId] = useState<ObjectId>();
  const [players, setPlayers] = useState<Array<User>>([]);
  const [synchronousBlock, setSynchronousBlock] = useState<boolean>(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarPlayerInQueueInfo, setSnackbarPlayerInQueueInfo] =
    useState<SnackbarPlayerInQueueInfoType>(undefined);
  const [playerSnackbars, setPlayerSnackbars] = React.useState<
    readonly SnackbarPlayerInQueueInfoType[]
  >([]);

  // Snackbar handlers
  const handleSnackbarOpen = () => setSnackbarOpen(true);
  const handleSnackbarClose = () => setSnackbarOpen(false);
  const handleSnackbarExited = () => setSnackbarPlayerInQueueInfo(undefined);

  // Consecutive snackbars (multiple snackbars without stacking them): (https://mui.com/material-ui/react-snackbar/#consecutive-snackbars)
  useEffect(() => {
    // Set a new snack when we don't have an active one
    if (playerSnackbars.length && !snackbarPlayerInQueueInfo) {
      setSnackbarPlayerInQueueInfo(playerSnackbars[0]);
      setPlayerSnackbars((prev) => prev.slice(1));
      handleSnackbarOpen();
    }
    // Close an active snack when a new one is added
    else if (playerSnackbars.length && snackbarPlayerInQueueInfo && snackbarOpen) {
      handleSnackbarClose();
    }
  }, [playerSnackbars, snackbarOpen, snackbarPlayerInQueueInfo]);

  /**
   * [1] currentUser arrives
   * ---------------------------------------------------
   * Assume room info and user info in the local storage are already updated previously.
   * 1. If you are a room admin:
   *    - Receive new room info (Room obj), list of players (Array<User>), and user (currentUser) info (User obj) from the response
   *    - Set admin ID (your user ID)
   *    - Include yourself (User obj) in the list of players (Array<User>)
   * 2. If you are a participant:
   *    - Receive new room info (Room obj), list of players (Array<User>), and user (currentUser) info (User obj) from the response
   *    - Set admin ID (room.roomAdmin)
   *    - Set list of participating players (Array<User>)
   *    - (Set other room config info, etc.)
   */
  useEffect(() => {
    if (!room) return;

    /** @todo: Should I only send room.players instead of whole 'room'? */
    socket.emit(
      NamespaceEnum.FETCH_PLAYERS,
      room,
      async ({ error, players }: FetchPlayersResponse) => {
        if (error) {
          outputServerError({ error });
        } else if (!players) {
          /** @todo - Failed to fetch players error (create new error) */
        } else {
          // Add admin
          setAdminId(room.roomAdmin);
          // Add list of players
          setPlayers(players);
        }
      }
    );
  }, [room, socket]);

  /**
   * [2] New user arrives
   * ---------------------------------------------------
   * - Receive new room info (Room obj), list of players (Array<User>), and user (participated) info (User obj) from the response
   * - Update room info in the local storage
   * - Append new user to the list of players (just replace original list of players with new list of players received)
   * - If list of players reaches more than MIN_NUM_PLAYERS, enable "allowStart"
   * - Display message that new user has arrived
   */
  // const handlePlayerIn = ({ user: player, room }: PlayerInResponse) => {
  //   setSynchronousBlock(true); // Block other execution for consistency / synchronous (to make sure data is stored before action)

  //   // Update room in the local storage first
  //   updateRoom(room);
  //   // Add new player in the list of players
  //   setPlayers((prevPlayers: User[]) => [...prevPlayers, player]);
  //   // Store player and snackbar info for snackbar notification + Add to snackbar queue
  //   setPlayerSnackbars((prev) => [
  //     ...prev,
  //     {
  //       key: new Date().getTime(),
  //       player: player,
  //       status: PlayerInQueueActionEnum.IN,
  //     },
  //   ]);

  //   setSynchronousBlock(false); // Unblock
  // };

  /**
   * Incoming socket event handler: Player joined room
   */
  useEffect(() => {
    const onPlayerJoined = ({ socketId, user: player, room }: PlayerInResponse) => {
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
          status: PlayerInQueueActionEnum.IN,
        },
      ]);

      setSynchronousBlock(false); // Unblock
    };

    socket.on(NamespaceEnum.PLAYER_IN, onPlayerJoined);
    return () => socket.off(NamespaceEnum.PLAYER_IN, onPlayerJoined);
  }, [socket, updateRoom]);

  /**
   * [3] currentUser leaves
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
   *    - Set new room admin ID (room.roomAdmin)
   *    - Display message that new user has left & admin has changed
   * 2. Else:
   *    - Display message that new user has left
   */
  //   const handlePlayerOut = ({ user: player, room }: PlayerOutResponse) => {
  //     setSynchronousBlock(true); // Block other execution for consistency / synchronous (to make sure data is stored before action)

  //     // Update room in the local storage first
  //     updateRoom(room);
  //     // If room still exists (at least one player left in the room) AND If admin changed then set new admin
  //     if (room && room.roomAdmin.toString() !== adminId?.toString()) {
  //       setAdminId(room.roomAdmin);
  //     }
  //     // Remove player from the list of players
  //     setPlayers((prevPlayers: User[]) =>
  //       prevPlayers.filter((prevPlayer: User) => prevPlayer._id.toString() !== player._id.toString())
  //     );
  //     // Store player and snackbar info for snackbar notification + Add to snackbar queue
  //     //
  //     setPlayerSnackbars((prev) => [
  //       ...prev,
  //       {
  //         key: new Date().getTime(),
  //         player: player,
  //         status: PlayerInQueueActionEnum.OUT,
  //       },
  //     ]);

  //     setSynchronousBlock(false); // Unblock
  //   };

  //   // Player connection status hook
  //   usePlayerStatus({
  //     onPlayerJoinedCallback: handlePlayerIn,
  //     onPlayerLeftCallback: handlePlayerOut,
  //   });

  /**
   * Incoming socket event handler: Player left room
   */
  useEffect(() => {
    const onPlayerLeft = ({ socketId, user: player, room }: PlayerOutResponse) => {
      setSynchronousBlock(true); // Block other execution for consistency / synchronous (to make sure data is stored before action)

      // Update room in the local storage first
      updateRoom(room);
      // If room still exists (at least one player left in the room) AND If admin changed then set new admin
      if (room && room.roomAdmin.toString() !== adminId?.toString()) {
        setAdminId(room.roomAdmin);
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
          status: PlayerInQueueActionEnum.OUT,
        },
      ]);

      setSynchronousBlock(false); // Unblock
    };

    socket.on(NamespaceEnum.PLAYER_OUT, onPlayerLeft);
    return () => socket.off(NamespaceEnum.PLAYER_OUT, onPlayerLeft);
  }, [adminId, socket, updateRoom]);

  return (
    <>
      <Outlet context={{ adminId, players, synchronousBlock }} />

      {/* Snackbar player in / out notification */}
      <SnackbarPlayerInQueue
        open={snackbarOpen}
        snackbarInfo={snackbarPlayerInQueueInfo}
        onClose={handleSnackbarClose}
        onExited={handleSnackbarExited}
      />
    </>
  );
};

export default GameLayout;