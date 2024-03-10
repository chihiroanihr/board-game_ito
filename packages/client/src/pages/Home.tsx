import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Box,
  FormHelperText,
  Typography,
  TextField,
  Stack,
  Button,
  CircularProgress,
  FormControl,
  Alert
} from '@mui/material';

import { type User, userNameConfig } from '@bgi/shared';

import { useAuth, useSocket } from '@/hooks';
import { navigateDashboard, outputServerError, outputResponseTimeoutError } from '@/utils';

type FormDataType = {
  name: string;
};

/**
 * Main page for Home
 * @returns
 */
function Home() {
  const navigate = useNavigate();

  const { socket } = useSocket();
  const { user, updateUser } = useAuth();

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Prepare react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormDataType>({
    defaultValues: { name: '' }
  });

  // Player name submitted
  const onSubmit = (data: FormDataType) => {
    setLoading(true); // Set loading to true when the request is initiated
    setErrorMessage(''); // Reset error message

    // Trim any start/end spaces
    const userName = data.name.trim();

    if (!userName) {
      setErrorMessage('Please enter a valid name.');
      setLoading(false);
      return;
    }

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      setLoading(false);
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit('login', userName, async (error: unknown, userResponse: User) => {
      // socket.emit("logout", userName);

      // Clear the timeout as response is received before timeout
      clearTimeout(timeoutId);

      if (error) {
        setErrorMessage('Internal Server Error: Please try again.');
        outputServerError({ error });
      } else {
        reset(); // Optionally reset form fields
        updateUser(userResponse); // Login and save user info to local storage
        navigateDashboard(navigate); // Navigate
      }

      setLoading(false); // Set loading to false when the response is received
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

  if (user) return null;
  return (
    <Stack spacing={{ xs: 3, md: 4, lg: 5 }} alignItems="center">
      <Typography variant="h3" component="h1">
        Welcome to ITO Game
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormControl>
          <Stack direction="row">
            {/* Input Field */}
            <TextField
              id="name"
              type="text"
              label="Name"
              variant="outlined"
              InputProps={{
                sx: {
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0
                }
              }}
              // Validate the name with react-hook-form
              {...register('name', {
                required: 'Name is required.',
                minLength: {
                  value: userNameConfig.minLength,
                  message: userNameConfig.minLengthErrorMessage
                },
                maxLength: {
                  value: userNameConfig.maxLength,
                  message: userNameConfig.maxLengthErrorMessage
                },
                pattern: {
                  value: userNameConfig.regex,
                  message: userNameConfig.regexErrorMessage
                }
              })}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              sx={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0
              }}
              disableElevation
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} color="inherit" />}
            >
              {loading ? 'Loading...' : 'Submit'}
            </Button>
          </Stack>

          {/* Validation Error */}
          <FormHelperText error={'name' in errors}>{errors.name?.message}</FormHelperText>
        </FormControl>

        {/* Form Request Error */}
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      </Box>
    </Stack>
  );
}

export default Home;
