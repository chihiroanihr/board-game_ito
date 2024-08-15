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

import { roomIdConfig, type JoinRoomResponse, NamespaceEnum } from '@bgi/shared';

import { TextButton } from '@/components';
import { useSocket, usePreFormSubmission, useAuth, useRoom } from '@/hooks';
import { navigateWaiting, outputServerError, outputResponseTimeoutError } from '@/utils';
import { type JoinRoomFormDataType } from '../enum.js';

/**
 * Sub-page for Dashboard
 * @returns
 */
function JoinRoom() {
  const navigate = useNavigate();
  const { socket } = useSocket();
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

  // Button click handlers
  const { loadingButton, formErrorMessage, setFormErrorMessage, processPreFormSubmission } =
    usePreFormSubmission();

  /**
   * Handler for joining to game waiting room.
   * @param data
   * @returns
   */
  const handleJoinRoom = (data: JoinRoomFormDataType) => {
    processPreFormSubmission(true); // Set submitting to true when the request is initiated
    setFormErrorMessage(''); // Reset error message

    const roomId = data.roomId.trim().toUpperCase();
    // ERROR
    if (!roomId) {
      processPreFormSubmission(false);
      setFormErrorMessage('Please enter a valid Room ID.');
      handleSnackbarOpen();
      return;
    }

    const timeoutId = setTimeout(() => {
      processPreFormSubmission(false);
      // ERROR
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit(
      NamespaceEnum.JOIN_ROOM,
      roomId,
      async ({ error, user: updatedUser, room: updatedRoom }: JoinRoomResponse) => {
        clearTimeout(timeoutId);

        // ERROR
        if (error) {
          outputServerError({ error });
          handleSnackbarOpen();
        } else {
          // SUCCESS: User can join room
          if (typeof updatedRoom === 'object') {
            updateUser(updatedUser ? updatedUser : null); // Store updated user info to local storage
            updateRoom(updatedRoom ? updatedRoom : null); // Save room info to local storage and navigate
            navigateWaiting(navigate); // Navigate
          }
          // ERROR: User cannot join room
          else {
            const unavailableMsg = updatedRoom; // room is now string message
            setFormErrorMessage(unavailableMsg || 'You cannot join this room for unknown reason.');
            handleSnackbarOpen();
          }
        }

        processPreFormSubmission(false);
      }
    );
  };

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
          <Alert severity="error">{formErrorMessage}</Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}

export default JoinRoom;
