import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Alert } from '@mui/material';

import { type RoomSetting, type CreateRoomResponse } from '@bgi/shared';

import { RoomSettingForm } from '@/components';
import { useAuth, useRoom, useSocket, useSubmissionStatus } from '@/hooks';
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
  const { setIsSubmitting } = useSubmissionStatus();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const processButtonStatus = (status: boolean) => {
    setIsLoading(status);
    setIsSubmitting(status);
  };

  const handleCreateRoom = (formData: RoomSetting) => {
    processButtonStatus(true);
    setErrorMessage(''); // Reset error message

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      processButtonStatus(false);
      outputResponseTimeoutError();
    }, 5000);

    // Send to socket
    socket.emit('create-room', formData, async ({ error, user, room }: CreateRoomResponse) => {
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

      processButtonStatus(false);
    });
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
      <RoomSettingForm onSubmit={handleCreateRoom} isLoading={isLoading}>
        Create
      </RoomSettingForm>

      {/* Form Request Error */}
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
    </Box>
  );
}

export default CreateRoom;
