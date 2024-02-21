import React, { useEffect, useState } from 'react';
import { ObjectId } from 'mongodb';
import { User, Room } from '@bgi/shared';

import { useAuth } from '../hooks/useAuth';
import { useRoom } from '../hooks/useRoom';
import { useSocket } from '../hooks/useSocket';
import { outputServerError, outputResponseTimeoutError } from '../utils';

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
  const [newPlayer, setNewPlayer] = useState<User>();
  const [playerLeft, setPlayerLeft] = useState<User>();

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
      socket.emit('wait-room', room, async (error: any, responsePlayers: Array<User>) => {
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
      setPlayers((prevPlayers) => [...prevPlayers, player]);

      // Store new player
      setNewPlayer(player);

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
      setPlayers((prevPlayers) =>
        prevPlayers.filter((prevPlayer) => prevPlayer._id.toString() !== player._id.toString())
      );

      // Store player left
      setPlayerLeft(player);
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
    socket.emit('start-game', room, async (error: any, response: any) => {
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
    <div>
      <h2>Waiting Room</h2>
      <p>Room ID: {room._id}</p>

      <div>
        <ul>
          {players.map((player, index) =>
            adminId?.toString() === player._id.toString() ? (
              // Admin
              <li key={player._id.toString()}>
                {index + 1}. {player.name} (admin)
              </li>
            ) : (
              // Participants
              <li key={player._id.toString()}>
                {index + 1}. {player.name}
              </li>
            )
          )}
        </ul>

        {newPlayer && <p>{newPlayer.name} just joined.</p>}
        {playerLeft && <p>{playerLeft.name} just left.</p>}
      </div>

      {adminId?.toString() === myself?._id.toString() && (
        <>
          {!allowStart && (
            <p>
              You need to have <b>{4 - players.length}</b> more players to begin the game.
            </p>
          )}

          <button onClick={handleStartGame} disabled={!allowStart || loading}>
            {loading ? 'Loading...' : 'Start Game'}
          </button>
        </>
      )}
    </div>
  );
}
