import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

import { User, Room, RoomSetting } from '@bgi/shared';

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
  const [errorMessage, setErrorMessage] = useState<string>('');

  type formDataType = {
    numRound: number;
    dupNumCard: string;
    thinkTimeTitle: number;
    thinkTimePlayers: number;
  };

  const formDefaultValues: formDataType = {
    numRound: 10,
    dupNumCard: 'false',
    thinkTimeTitle: 60,
    thinkTimePlayers: 20
  };

  // Prepare react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<formDataType>({
    defaultValues: formDefaultValues
  });

  const onsubmit = (data: formDataType) => {
    console.log(data);
    setLoading(true);
    setErrorMessage(''); // Reset error message

    const roomSettingData: RoomSetting = {
      ...data,
      dupNumCard: data.dupNumCard === 'true' // Convert string to boolean
    };

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      setLoading(false);
      outputResponseTimeoutError();
    }, 5000);

    // Send to socket
    socket.emit('create-room', roomSettingData, async (error: any, response: SocketEventType) => {
      // socket.emit("create-room", user);

      // Clear the timeout as response is received before timeout
      clearTimeout(timeoutId);

      const { user, room } = response;

      if (error) {
        setErrorMessage('Internal Server Error: Please try again.');
        outputServerError({ error });
      } else {
        updateUser(user); // Store updated user info to local storage
        updateRoom(room); // Store room info to local storage and redirect
        navigateWaiting(navigate); // Navigate

        reset(); // Optionally reset form fields
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
      <h2>Create Room:</h2>

      <form onSubmit={handleSubmit(onsubmit, onerror)} noValidate>
        <label htmlFor="numRound">
          Number of Rounds:
          <input
            type="number"
            {...register('numRound', {
              required: 'This field is required.',
              min: { value: 4, message: 'Must be at least 4 rounds.' },
              max: { value: 10, message: 'Cannot exceed 10 rounds.' }
            })}
          />
        </label>

        {/* Validation Error */}
        {errors.numRound && <p>{errors.numRound.message}</p>}

        <label htmlFor="dupNumCard">
          Allow score card duplicate between rounds:
          <label>
            <input
              type="radio"
              value={true}
              {...register('dupNumCard', { required: 'This field is required.' })}
            />
            Enable
          </label>
          <label>
            <input
              type="radio"
              value={false}
              {...register('dupNumCard', { required: 'This field is required.' })}
            />
            Disable
          </label>
        </label>

        {/* Validation Error */}
        {errors.dupNumCard && <p>{errors.dupNumCard.message}</p>}

        <label htmlFor="thinkTimeTitle">
          Thinking time for answering to the title card (seconds):
          <input
            type="number"
            {...register('thinkTimeTitle', {
              required: 'This field is required.',
              min: 30,
              max: 90
            })}
          />
        </label>

        {/* Validation Error */}
        {errors.thinkTimeTitle && <p>{errors.thinkTimeTitle.message}</p>}

        <label htmlFor="thinkTimePlayers">
          Thinking time for players to point placement of the card (seconds):
          <input
            type="number"
            {...register('thinkTimePlayers', {
              required: 'This field is required.',
              min: 10,
              max: 30
            })}
          />
        </label>

        {/* Validation Error */}
        {errors.thinkTimePlayers && <p>{errors.thinkTimePlayers.message}</p>}

        {/* Form Request Error */}
        {errorMessage && <p className="error">{errorMessage}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Create Room'}
        </button>
      </form>
    </div>
  );
}

export default CreateRoom;
