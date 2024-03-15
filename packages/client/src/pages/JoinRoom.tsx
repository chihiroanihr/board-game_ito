import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Typography,
  Box,
  Card,
  Button,
  Stack,
  CircularProgress,
  TextField,
  FormHelperText,
  Alert,
  Snackbar,
} from '@mui/material';

import { roomIdConfig, type JoinRoomResponse } from '@bgi/shared';

import { CardContentOverride } from '../theme';
import { useAuth, useRoom, useSocket } from '@/hooks';
import { navigateWaiting, outputServerError, outputResponseTimeoutError } from '@/utils';

type FormDataType = {
  roomId: string;
};

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
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);

  // Prepare react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormDataType>({
    defaultValues: { roomId: '' },
  });

  // Room ID Submitted
  const onsubmit = (data: FormDataType) => {
    setLoading(true);
    setErrorMessage(''); // Reset error message

    const roomId = data.roomId.trim().toUpperCase();

    if (!roomId) {
      setErrorMessage('Please enter a valid Room ID.');
      setSnackbarOpen(true);
      setLoading(false);
      return;
    }

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      setLoading(false);
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit('join-room', roomId, async ({ error, user, room }: JoinRoomResponse) => {
      // Clear the timeout as response is received before timeout
      clearTimeout(timeoutId);

      if (error) {
        setErrorMessage('Internal Server Error: Please try again.');
        outputServerError({ error });
      } else {
        // User can join room
        if (typeof room === 'object') {
          updateUser(user ? user : null); // Store updated user info to local storage
          updateRoom(room ? room : null); // Save room info to local storage and navigate
          navigateWaiting(navigate); // Navigate
        }
        // User cannot join room
        else {
          setErrorMessage(room ? room : 'You cannot join this room for unknown reason.');
          setSnackbarOpen(true);
        }

        reset(); // Optionally reset form fields
      }

      setLoading(false);
    });
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="flex-start" gap={4}>
      <Typography variant="h4" component="h2">
        Join Room
      </Typography>

      <Box
        component="form"
        display="flex"
        flexDirection="column"
        gap={4}
        onSubmit={handleSubmit(onsubmit)}
        noValidate
      >
        {/* Form */}
        <Card variant="outlined" sx={{ px: '2rem', py: '3.5rem', borderRadius: '0.8rem' }}>
          <CardContentOverride>
            <Stack direction="column" spacing={2}>
              <FormHelperText>Enter Room ID to Join:</FormHelperText>
              {/* Input Field */}
              <TextField
                fullWidth
                id="roomId"
                type="text"
                label="Room ID"
                size="small"
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
                helperText={errors.roomId ? errors.roomId.message : ''}
              />
            </Stack>
          </CardContentOverride>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {loading ? 'Loading...' : 'Join Room'}
        </Button>

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
