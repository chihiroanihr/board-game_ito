import React, { useState } from 'react';
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

import { roomIdConfig } from '@bgi/shared';

import { TextButtonStyled } from '@/components';
import {
  useAction,
  type BeforeSubmitCallbackFunction,
  type ErrorCallbackParams,
  type ErrorCallbackFunction,
  type SuccessCallbackFunction,
} from '@/hooks';
import { type JoinRoomFormDataType } from '../enum.js';

/**
 * Subpage for Dashboard
 * @returns
 */
function JoinRoom() {
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
  const beforeSubmit: BeforeSubmitCallbackFunction = () => {};
  const onError: ErrorCallbackFunction = ({ action }: ErrorCallbackParams) => {
    handleSnackbarOpen();
  };
  const onSuccess: SuccessCallbackFunction = ({ action }) => {};

  // Button click handlers
  const { handleJoinRoom, loadingButton, errorMessage } = useAction({
    beforeSubmit,
    onError,
    onSuccess,
  });

  return (
    <Box display="flex" flexDirection="column" alignItems="flex-start" gap={3}>
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
                helperText={errors.roomId?.message ?? null}
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <TextButtonStyled type="submit" variant="contained" loading={loadingButton}>
          Join Room
        </TextButtonStyled>

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
