import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  TextField,
  FormHelperText,
  Alert,
  Snackbar,
} from '@mui/material';

import { roomIdConfig, NamespaceEnum } from '@bgi/shared';

import { TextButton } from '@/components';
import {
  useAction,
  useAuth,
  useRoom,
  type BeforeSubmitCallbackParams,
  type BeforeSubmitCallbackFunction,
  type ErrorCallbackParams,
  type ErrorCallbackFunction,
  type SuccessCallbackFunction,
} from '@/hooks';
import { navigateWaiting } from '@/utils';
import { type JoinRoomFormDataType } from '../enum.js';

/**
 * Subpage for Dashboard
 * @returns
 */
function JoinRoom() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const { updateRoom } = useRoom();

  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);

  // Prepare react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinRoomFormDataType>({
    defaultValues: { roomId: '' },
  });

  // Snackbar open / close handlers
  const handleSnackbarClose = () => setSnackbarOpen(false);
  const handleSnackbarOpen = () => setSnackbarOpen(true);

  // Callback for button click handlers
  const beforeSubmit: BeforeSubmitCallbackFunction = ({ action }: BeforeSubmitCallbackParams) => {};
  const onError: ErrorCallbackFunction = ({ action }: ErrorCallbackParams) => {
    handleSnackbarOpen();
  };
  const onSuccess: SuccessCallbackFunction = ({ action, user: updatedUser, room: updatedRoom }) => {
    switch (action) {
      case NamespaceEnum.JOIN_ROOM:
        updateUser(updatedUser ? updatedUser : null); // Store updated user info to local storage
        updateRoom(updatedRoom ? updatedRoom : null); // Save room info to local storage and navigate
        navigateWaiting(navigate); // Navigate
        break;
      default:
        console.error('[!] Unknown action: ', action);
    }
  };

  // Button click handlers
  const { handleJoinRoom, loadingButton, errorMessage } = useAction({
    beforeSubmit,
    onError,
    onSuccess,
  });

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      gap={{ xs: '2rem', md: '1.4rem' }}
    >
      <Typography variant="h4" component="h2">
        Join Room
      </Typography>

      <Box
        component="form"
        display="flex"
        flexDirection="column"
        gap={4}
        onSubmit={handleSubmit(handleJoinRoom)}
        noValidate
      >
        {/* Form */}
        <Card variant="outlined" sx={{ px: '2rem', py: '3.5rem', borderRadius: '0.8rem' }}>
          <CardContent>
            <Stack direction="column" spacing={2}>
              <FormHelperText>Enter Room ID to Join:</FormHelperText>
              {/* Input Field */}
              <TextField
                id="roomId"
                type="text"
                label="Room ID"
                placeholder={roomIdConfig.placeholder}
                // Validate the roomId with react-hook-form
                {...register('roomId', {
                  required: 'Room ID is required',
                  pattern: {
                    value: roomIdConfig.regex,
                    message: roomIdConfig.errorMessage,
                  },
                })}
                // Validation Error
                error={Boolean(errors.roomId)}
                helperText={errors.roomId?.message ?? null}
                // CSS
                size="small"
                fullWidth
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <TextButton
          type="submit"
          variant="contained"
          loading={loadingButton}
          loadingElement="Loading..."
        >
          Join Room
        </TextButton>

        {/* Form Request Error */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={5000}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          onClose={handleSnackbarClose}
        >
          <Alert severity="error">{errorMessage}</Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}

export default JoinRoom;
