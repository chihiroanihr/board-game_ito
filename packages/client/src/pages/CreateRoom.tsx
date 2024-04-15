import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Alert, Stack } from '@mui/material';

import { NamespaceEnum } from '@bgi/shared';

import { RoomSettingForm } from '@/components';
import {
  useAction,
  useAuth,
  useRoom,
  type BeforeSubmitCallbackParams,
  type BeforeSubmitCallbackFunction,
  type ErrorCallbackParams,
  type ErrorCallbackFunction,
  type SuccessCallbackParams,
  type SuccessCallbackFunction,
} from '@/hooks';
import { navigateWaiting } from '@/utils';

/**
 * Subpage for Dashboard
 * @returns
 */
function CreateRoom() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const { updateRoom } = useRoom();

  // Callback for button click handlers
  const beforeSubmit: BeforeSubmitCallbackFunction = ({ action }: BeforeSubmitCallbackParams) => {};
  const onError: ErrorCallbackFunction = ({ action }: ErrorCallbackParams) => {};
  const onSuccess: SuccessCallbackFunction = ({
    action,
    user: updatedUser,
    room: updatedRoom,
  }: SuccessCallbackParams) => {
    switch (action) {
      case NamespaceEnum.CREATE_ROOM:
        updateUser(updatedUser ? updatedUser : null); // Store updated user info to local storage
        updateRoom(updatedRoom ? updatedRoom : null); // Store room info to local storage and redirect
        navigateWaiting(navigate); // Navigate
        break;
      default:
        console.error('[!] Unknown action: ', action);
    }
  };

  // Button click handlers
  const { handleCreateRoom, loadingButton, errorMessage, setErrorMessage } = useAction({
    beforeSubmit,
    onError,
    onSuccess,
  });

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
  }, [errorMessage, setErrorMessage]);

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
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
    </Box>
  );
}

export default CreateRoom;
