import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Box,
  Stack,
  Card,
  Typography,
  Button,
  CircularProgress,
  TextField,
  FormControl,
  FormLabel,
  FormControlLabel,
  FormHelperText,
  RadioGroup,
  Radio,
  Alert
} from '@mui/material';

import { User, Room, RoomSetting, roomSettingConfig } from '@bgi/shared';

import { CardContentOverride } from '../theme';
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
    numRound: roomSettingConfig.numRound.defaultRounds,
    dupNumCard: 'false',
    thinkTimeTitle: roomSettingConfig.thinkTimeTitle.defaultSeconds,
    thinkTimePlayers: roomSettingConfig.thinkTimePlayers.defaultSeconds
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
            <Stack direction="column" spacing={4}>
              {/* Field 1 */}
              <Stack direction="column" spacing={1}>
                <TextField
                  fullWidth
                  id="numRound"
                  type="number"
                  label="Number of Rounds"
                  size="small"
                  {...register('numRound', {
                    required: 'This field is required.',
                    min: {
                      value: roomSettingConfig.numRound.minRounds,
                      message: roomSettingConfig.numRound.minRoundsErrorMessage
                    },
                    max: {
                      value: roomSettingConfig.numRound.maxRounds,
                      message: roomSettingConfig.numRound.maxRoundsErrorMessage
                    }
                  })}
                  // Validation Error
                  error={Boolean(errors.numRound)}
                  helperText={errors.numRound ? errors.numRound.message : ''}
                />
                <FormHelperText>{roomSettingConfig.numRound.helperText}</FormHelperText>
              </Stack>

              {/* Field 2 */}
              <Stack direction="column" spacing={1}>
                <TextField
                  fullWidth
                  id="thinkTimeTitle"
                  type="number"
                  label="Title Thinking Time"
                  size="small"
                  {...register('thinkTimeTitle', {
                    required: 'This field is required.',
                    min: {
                      value: roomSettingConfig.thinkTimeTitle.minSeconds,
                      message: roomSettingConfig.thinkTimeTitle.minSecondsErrorMessage
                    },
                    max: {
                      value: roomSettingConfig.thinkTimeTitle.maxSeconds,
                      message: roomSettingConfig.thinkTimeTitle.maxSecondsErrorMessage
                    }
                  })}
                  // Validation Error
                  error={Boolean(errors.thinkTimeTitle)}
                  helperText={errors.thinkTimeTitle ? errors.thinkTimeTitle.message : ''}
                />
                <FormHelperText>{roomSettingConfig.thinkTimeTitle.helperText}</FormHelperText>
              </Stack>

              {/* Field 3 */}
              <Stack direction="column" spacing={1}>
                <TextField
                  fullWidth
                  id="thinkTimePlayers"
                  type="number"
                  label="Players Thinking Time"
                  size="small"
                  {...register('thinkTimePlayers', {
                    required: 'This field is required.',
                    min: {
                      value: roomSettingConfig.thinkTimePlayers.minSeconds,
                      message: roomSettingConfig.thinkTimePlayers.minSecondsErrorMessage
                    },
                    max: {
                      value: roomSettingConfig.thinkTimePlayers.maxSeconds,
                      message: roomSettingConfig.thinkTimePlayers.maxSecondsErrorMessage
                    }
                  })}
                  // Validation Error
                  error={Boolean(errors.thinkTimePlayers)}
                  helperText={errors.thinkTimePlayers ? errors.thinkTimePlayers.message : ''}
                />
                <FormHelperText>{roomSettingConfig.thinkTimePlayers.helperText}</FormHelperText>
              </Stack>

              {/* Radio Buttons */}
              <FormControl>
                <FormLabel component="legend">{roomSettingConfig.dupNumCard.label}</FormLabel>
                <RadioGroup name="dupNumCard" defaultValue={false} row>
                  <FormControlLabel
                    value={true}
                    label={roomSettingConfig.dupNumCard.radioTrue}
                    control={<Radio size="small" />}
                    {...register('dupNumCard', { required: 'This field is required.' })}
                  />
                  <FormControlLabel
                    value={false}
                    label={roomSettingConfig.dupNumCard.radioFalse}
                    control={<Radio size="small" />}
                    {...register('dupNumCard', { required: 'This field is required.' })}
                  />
                </RadioGroup>

                <FormHelperText error={Boolean(errors.dupNumCard)}>
                  {errors.dupNumCard?.message}
                </FormHelperText>
              </FormControl>
            </Stack>
          </CardContentOverride>
        </Card>

        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {loading ? 'Loading...' : 'Create Room'}
        </Button>
      </Box>

      {/* Form Request Error */}
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
    </Box>
  );
}

export default CreateRoom;
