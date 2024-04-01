import React, { useEffect } from 'react';
import { Box, Typography, Alert, Stack } from '@mui/material';

import { RoomSettingForm } from '@/components';
import {
  useAction,
  type BeforeSubmitCallbackFunction,
  type ErrorCallbackParams,
  type ErrorCallbackFunction,
  type SuccessCallbackParams,
  type SuccessCallbackFunction,
} from '@/hooks';

/**
 * Subpage for Dashboard
 * @returns
 */
function CreateRoom() {
  // Callback for button click handlers
  const beforeSubmit: BeforeSubmitCallbackFunction = () => {};
  const onError: ErrorCallbackFunction = ({ action }: ErrorCallbackParams) => {};
  const onSuccess: SuccessCallbackFunction = ({ action }: SuccessCallbackParams) => {};

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
    <Box display="flex" flexDirection="column" alignItems="flex-start" gap={3}>
      <Stack direction="column" spacing={0.5}>
        <Typography variant="h4" component="h2">
          Create Room
        </Typography>
        <Typography variant="body2" component="div">
          Configure the below game room options.
        </Typography>
      </Stack>

      {/* Form */}
      <RoomSettingForm onSubmit={handleCreateRoom} isLoading={loadingButton}>
        Create
      </RoomSettingForm>

      {/* Form Request Error */}
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
    </Box>
  );
}

export default CreateRoom;
