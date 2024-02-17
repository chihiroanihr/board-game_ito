import { useEffect, useState } from "react";

import { useAuth } from "../hooks/useAuth";
import { useRoom } from "../hooks/useRoom";
import { useSocket } from "../hooks/useSocket";
import { outputServerError, outputResponseTimeoutError } from "../utils";

export default function Waiting() {
  const { user: myself } = useAuth();
  const { room, updateRoom } = useRoom();
  const { socket } = useSocket();

  const [adminId, setAdminId] = useState();
  const [players, setPlayers] = useState([]);
  const [newPlayer, setNewPlayer] = useState();
  const [playerLeft, setPlayerLeft] = useState();

  const [loading, setLoading] = useState(false);
  const [allowStart, setAllowStart] = useState(false);

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
    socket.emit("wait-room", room, async (error, responsePlayers) => {
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
    async function onNewPlayerArriveEvent(data) {
      const { user: player, room } = data;

      // Update room in the local storage first
      updateRoom(room);

      // Add new player in the list of players
      setPlayers((prevPlayers) => [...prevPlayers, player]);

      // Store new player
      setNewPlayer(`${player._id}: ${player.name}`);

      // Enable start button if more than 4 players
      if (players.length >= 4) {
        setAllowStart(true);
      }
    }

    // Runs whenever a socket event is recieved from the server
    socket.on("new-player", onNewPlayerArriveEvent);

    return () => {
      socket.off("new-player", onNewPlayerArriveEvent);
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
    async function onPlayerLeaveEvent(data) {
      // Disable start button if less than 4 players
      if (players.length <= 4) {
        setAllowStart(false);
      }

      const { user: player, room } = data;

      // Update room in the local storage first
      updateRoom(room);

      // If admin changed then set new admin
      if (room.createdBy.toString() !== adminId.toString()) {
        setAdminId(room.createdBy);
      }

      // Remove player from the list of players
      setPlayers((prevPlayers) =>
        prevPlayers.filter(
          (prevPlayer) => prevPlayer._id.toString() !== player._id.toString()
        )
      );

      // Store player left
      setPlayerLeft(`${player._id}: ${player.name}`);
    }

    // Runs whenever a socket event is recieved from the server
    socket.on("player-left", onPlayerLeaveEvent);

    return () => {
      socket.off("player-left", onPlayerLeaveEvent);
    };
  }, [adminId, players, socket, updateRoom]);

  /**
   * Start game
   */
  const handleStartGame = () => {
    setLoading(true);

    // Send to socket
    socket.emit("start-game", room, async (error, response) => {
      // socket.emit("start-game", room);

      // Clear the timeout as response is received before timeout
      clearTimeout(
        // Create a timeout to check if the response is received
        setTimeout(() => {
          setLoading(false);
          outputResponseTimeoutError();
        }, 5000)
      );

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
            adminId && adminId.toString() === player._id.toString() ? (
              // Admin
              <li key={player._id}>
                {index + 1}. {player.name} (admin)
              </li>
            ) : (
              // Participants
              <li key={player._id}>
                {index + 1}. {player.name}
              </li>
            )
          )}
        </ul>

        {newPlayer && <p>{newPlayer.name} just joined.</p>}
        {playerLeft && <p>{playerLeft.name} just left.</p>}
      </div>

      {myself._id.toString() === adminId.toString() && (
        <button onClick={handleStartGame} disabled={allowStart && loading}>
          {loading ? "Loading..." : "Start Game"}
        </button>
      )}
    </div>
  );
}
