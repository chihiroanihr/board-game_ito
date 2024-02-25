import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { User, Room } from '@bgi/shared';

import { useAuth, useRoom, useSocket } from '@/hooks';
import { navigateWaiting, outputServerError, outputResponseTimeoutError } from '@/utils';

type SocketEventType = {
  user: User;
  room: Room;
};

/**
 * Subpage for Dashboard
 * @returns
 */
function CreateRoom() {
  const navigate = useNavigate();

  const { socket } = useSocket();
  const { updateUser } = useAuth();
  const { updateRoom } = useRoom();

  const [loading, setLoading] = useState<boolean>(false);

  const handleCreateRoom = () => {
    setLoading(true);

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      setLoading(false);
      outputResponseTimeoutError();
    }, 5000);

    // Send to socket
    socket.emit('create-room', async (error: any, response: SocketEventType) => {
      // socket.emit("create-room", user);

      // Clear the timeout as response is received before timeout
      clearTimeout(timeoutId);

      const { user, room } = response;

      if (error) {
        outputServerError({ error });
      } else {
        updateUser(user); // Store updated user info to local storage
        updateRoom(room); // Store room info to local storage and redirect
        navigateWaiting(navigate); // Navigate
      }

      setLoading(false);
    });
  };

  // useEffect(() => {
  //   async function onCreateRoomSuccessEvent(data) {
  //     try {
  //       const { user, room } = data;

  //       if (user && room) {
  //         updateUser(user); // Store updated user info to local storage
  //         updateRoom(room); // Store room info to local storage and redirect
  //         navigateWaiting(navigate); // Navigate
  //       } else {
  //         throw new Error("Returned data is missing from the server.");
  //       }
  //     } catch (error) {
  //       outputServerError({ error });
  //     }
  //   }

  //   socket.on("create-room_success", onCreateRoomSuccessEvent);

  //   return () => {
  //     socket.off("create-room_success", onCreateRoomSuccessEvent);
  //   };
  // }, [updateRoom, socket]);

  // useEffect(() => {
  //   async function onCreateRoomErrorEvent(error) {
  //     outputServerError({ error });
  //   }

  //   socket.on("create-room_error", onCreateRoomErrorEvent);

  //   return () => {
  //     socket.off("create-room_error", onCreateRoomErrorEvent);
  //   };
  // }, [updateRoom, socket]);

  return (
    <div>
      {/** @todo - All room config settings */}
      <button onClick={handleCreateRoom} disabled={loading}>
        {loading ? 'Loading...' : 'Create Room'}
      </button>
    </div>
  );
}

export default CreateRoom;
