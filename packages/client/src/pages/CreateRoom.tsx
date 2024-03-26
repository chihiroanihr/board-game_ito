import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Alert } from '@mui/material';

import { type RoomSetting, type CreateRoomResponse } from '@bgi/shared';

import { RoomSettingForm } from '@/components';
import { useAuth, useRoom, useSocket } from '@/hooks';
import { navigateWaiting, outputServerError, outputResponseTimeoutError } from '@/utils';

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

  const onsubmit = (data: RoomSetting) => {
    setLoading(true);
    setErrorMessage(''); // Reset error message

    // Adjust / clean the type of form inputs
    const roomSettingData: RoomSetting = {
      ...data,
      // Convert string to boolean
      heartEnabled:
        typeof data.heartEnabled === 'boolean' ? data.heartEnabled : data.heartEnabled === 'true',
      dupNumCard:
        typeof data.dupNumCard === 'boolean' ? data.dupNumCard : data.dupNumCard === 'true',
    };

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      setLoading(false);
      outputResponseTimeoutError();
    }, 5000);

    // Send to socket
    socket.emit(
      'create-room',
      roomSettingData,
      async ({ error, user, room }: CreateRoomResponse) => {
        // Clear the timeout as response is received before timeout
        clearTimeout(timeoutId);

        if (error) {
          setErrorMessage('Internal Server Error: Please try again.');
          outputServerError({ error });
        } else {
          updateUser(user ? user : null); // Store updated user info to local storage
          updateRoom(room ? room : null); // Store room info to local storage and redirect
          navigateWaiting(navigate); // Navigate
        }

        setLoading(false);
      }
    );
  };

  // Disappear error message after 5 seconds
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (errorMessage) {
      timer = setTimeout(() => {
        setErrorMessage('');
      }, 5000);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [errorMessage]);

  return (
    <Box display="flex" flexDirection="column" alignItems="flex-start" gap={4}>
      <Typography variant="h4" component="h2">
        Create Room
      </Typography>

      {/* Form */}
      <RoomSettingForm onsubmit={onsubmit} loading={loading} />

      {/* Form Request Error */}
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
    </Box>
  );
}

export default CreateRoom;
