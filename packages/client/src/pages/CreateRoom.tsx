import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Alert, Stack } from '@mui/material';

import { type RoomSetting, type CreateRoomResponse, NamespaceEnum } from '@bgi/shared';

import { RoomSettingForm } from '@/components';
import { useSocket, usePreFormSubmission, useAuth, useRoom } from '@/hooks';
import { navigateWaiting, outputServerError, outputResponseTimeoutError } from '@/utils';

/**
 * Sub-page for Dashboard
 * @returns
 */
function CreateRoom() {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { updateRoom } = useRoom();

  // Button click handlers
  const { loadingButton, formErrorMessage, setFormErrorMessage, processPreFormSubmission } =
    usePreFormSubmission();

  /**
   * Handler for creating game room (by admin).
   * @param formData
   */
  const handleCreateRoom = (formData: RoomSetting) => {
    processPreFormSubmission(true); // Set submitting to true when the request is initiated
    setFormErrorMessage(''); // Reset error message

    const timeoutId = setTimeout(() => {
      processPreFormSubmission(false);
      // ERROR
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit(
      NamespaceEnum.CREATE_ROOM,
      formData,
      async ({ error, user: updatedUser, room: updatedRoom }: CreateRoomResponse) => {
        clearTimeout(timeoutId);

        // ERROR
        if (error) {
          outputServerError({ error });
        }
        // SUCCESS
        else {
          updateUser(updatedUser ? updatedUser : null); // Store updated user info to local storage
          updateRoom(updatedRoom ? updatedRoom : null); // Store room info to local storage and redirect
          navigateWaiting(navigate); // Navigate
        }

        processPreFormSubmission(false);
      }
    );
  };

  // Disappear error message after 5 seconds
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (formErrorMessage) {
      timer = setTimeout(() => {
        setFormErrorMessage('');
      }, 5000);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [formErrorMessage, setFormErrorMessage]);

  if (!user) return null;
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      gap={{ xs: '2rem', md: '1.4rem' }}
      height="100%"
    >
      <Stack direction="column" spacing="0.1rem">
        <Typography variant="h4" component="h2" fontSize={{ md: '2rem' }}>
          Create Room
        </Typography>
        <Typography variant="body2" component="div">
          Configure the below game room options.
        </Typography>
      </Stack>

      {/* Form */}
      <RoomSettingForm onSubmit={handleCreateRoom} isLoading={loadingButton} pb="1.4rem">
        Create
      </RoomSettingForm>

      {/* Form Request Error */}
      {formErrorMessage && <Alert severity="error">{formErrorMessage}</Alert>}
    </Box>
  );
}

export default CreateRoom;
