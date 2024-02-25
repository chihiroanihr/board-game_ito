import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

import { User, Room, roomIdConfig } from '@bgi/shared';

import { useAuth, useRoom, useSocket } from '@/hooks';
import { navigateWaiting, outputServerError, outputResponseTimeoutError } from '@/utils';

type FormDataType = {
  roomId: string;
};

type SocketEventType =
  | {
      user: User;
      room: Room;
    }
  | string;

/**
 * Subpage for Dashboard
 * @returns
 */
function JoinRoom() {
  const navigate = useNavigate();

  const { socket } = useSocket();
  const { updateUser } = useAuth();
  const { updateRoom } = useRoom();

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Prepare react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormDataType>({
    defaultValues: { roomId: '' }
  });

  // Room ID Submitted
  const onSubmit = (data: FormDataType) => {
    setLoading(true);
    setErrorMessage(''); // Reset error message

    const roomId = data.roomId.trim().toUpperCase();

    if (!roomId) {
      setErrorMessage('Please enter a valid Room ID.');
      setLoading(false);
      return;
    }

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      setLoading(false);
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit('join-room', roomId, async (error: any, response: SocketEventType) => {
      // socket.emit("join-room", roomId);

      // Clear the timeout as response is received before timeout
      clearTimeout(timeoutId);

      if (error) {
        setErrorMessage('Internal Server Error: Please try again.');
        outputServerError({ error });
      } else {
        // User can join room
        if (typeof response === 'object') {
          const { user, room } = response;

          updateUser(user); // Store updated user info to local storage
          updateRoom(room); // Save room info to local storage and navigate
          navigateWaiting(navigate); // Navigate
        }
        // User cannot join room
        else {
          setErrorMessage(response);
        }

        reset(); // Optionally reset form fields
      }

      setLoading(false);
    });
  };

  // useEffect(() => {
  //   async function onJoinRoomSuccessEvent(data) {
  //     try {
  //       // User can join room
  //       if (typeof data === "object") {
  //         const { user, room } = data;

  //         if (user && room) {
  //           updateUser(user); // Store updated user info to local storage
  //           updateRoom(room); // Save room info to local storage and navigate
  //           navigateWaiting(navigate); // Navigate
  //         } else {
  //           throw new Error("Returned data is missing from the server.");
  //         }
  //       }
  //       // User cannot join room
  //       else {
  //         setErrorMessage(data);
  //       }
  //     } catch (error) {
  //       outputServerError({ error });
  //     }
  //   }

  //   socket.on("join-room_success", onJoinRoomSuccessEvent);

  //   // Cleanup the socket event listener when the component unmounts
  //   return () => {
  //     socket.off("join-room_success", onJoinRoomSuccessEvent);
  //   };
  // }, [updateRoom, socket]);

  // useEffect(() => {
  //   async function onJoinRoomErrorEvent(error) {
  //     outputServerError({ error });
  //   }

  //   socket.on("join-room_error", onJoinRoomErrorEvent);

  //   return () => {
  //     socket.off("join-room_error", onJoinRoomErrorEvent);
  //   };
  // }, [updateRoom, socket]);

  return (
    <div>
      <h2>Enter Room ID to Join:</h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label htmlFor="roomId">Room ID: </label>

        {/* Input Field */}
        <input
          type="text"
          id="roomId"
          placeholder={roomIdConfig.placeholder}
          // Validate the roomId with react-hook-form
          {...register('roomId', {
            required: 'Room ID is required',
            pattern: {
              value: new RegExp(`^[${roomIdConfig.letterRegex}]{${roomIdConfig.numLetters}}$`),
              message: roomIdConfig.error_message
            }
          })}
        />

        {/* Validation Error */}
        {errors.roomId && <p>{errors.roomId.message}</p>}

        {/* Form Request Error */}
        {errorMessage && <p className="error">{errorMessage}</p>}

        {/* Submit Button */}
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Join Room'}
        </button>
      </form>
    </div>
  );
}

export default JoinRoom;
