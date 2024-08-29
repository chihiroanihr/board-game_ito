import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Box,
  FormHelperText,
  Typography,
  TextField,
  Stack,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import { userNameConfig, type LoginResponse, NamespaceEnum } from '@bgi/shared';

import { TextButton } from '@/components';
import { useSocket, useAuth, usePreFormSubmission } from '@/hooks';
import { navigateDashboard, outputServerError, outputResponseTimeoutError } from '@/utils';
import { type LoginFormDataType } from '../enum';

/**
 * Main page for Home
 * @returns
 */
function Home() {
  const { socket } = useSocket();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmViewport = useMediaQuery(theme.breakpoints.up('sm'));

  // Prepare react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormDataType>({
    defaultValues: { name: '' },
  });

  // Button click handlers
  const { loadingButton, formErrorMessage, setFormErrorMessage, processPreFormSubmission } =
    usePreFormSubmission();

  /**
   * Handler for user logging into the game.
   * @param data
   * @returns
   */
  const handleLogin = (data: LoginFormDataType) => {
    processPreFormSubmission(true); // Set submitting to true when the request is initiated
    setFormErrorMessage(''); // Reset error message

    const userName = data.name.trim(); // Trim any start/end spaces
    // ERROR
    if (!userName) {
      setFormErrorMessage('Please enter a valid name.');
      processPreFormSubmission(false);
      return;
    }

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      processPreFormSubmission(false); // Set submitting to false when the input error happens
      // ERROR
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit(
      NamespaceEnum.LOGIN,
      userName,
      async ({ error, user: updatedUser }: LoginResponse) => {
        clearTimeout(timeoutId); // Clear the timeout as response is received before timeout

        // ERROR
        if (error) {
          outputServerError(error);
        }
        // SUCCESS
        else {
          updateUser(updatedUser ? updatedUser : null); // Login and save user info to local storage
          navigateDashboard(navigate); // Navigate
        }

        processPreFormSubmission(false); // Set submitting to false when the response is received
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

  if (user) return null;
  return (
    <Stack spacing={'1.4rem'} flexGrow={1} alignItems="center">
      <Typography variant="h3" component="h1" fontSize={{ xs: '2rem', md: '2.5rem' }}>
        Welcome to ITO Game
      </Typography>

      <Box component="form" onSubmit={handleSubmit(handleLogin)} noValidate>
        <Stack direction="row">
          {/* Input Field */}
          <TextField
            id="name"
            type="text"
            variant="outlined"
            label="Name"
            sx={{ width: isSmViewport ? '20rem' : 'auto' }}
            InputProps={{
              sx: {
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
              },
            }}
            // Validate the name with react-hook-form
            {...register('name', {
              required: 'Name is required.',
              minLength: {
                value: userNameConfig.minLength,
                message: userNameConfig.minLengthErrorMessage,
              },
              maxLength: {
                value: userNameConfig.maxLength,
                message: userNameConfig.maxLengthErrorMessage,
              },
              pattern: {
                value: userNameConfig.regex,
                message: userNameConfig.regexErrorMessage,
              },
            })}
            fullWidth={!isSmViewport}
          />

          {/* Submit Button */}
          <TextButton
            type="submit"
            variant="contained"
            loading={loadingButton}
            loadingElement="Loading..."
            disableElevation
            sx={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            }}
          >
            Submit
          </TextButton>
        </Stack>

        {/* Validation Error */}
        {Boolean(errors.name) && (
          <FormHelperText error={Boolean(errors.name)}>
            {errors.name?.message ?? null}
          </FormHelperText>
        )}

        {/* Form Request Error */}
        {formErrorMessage && <Alert severity="error">{formErrorMessage}</Alert>}
      </Box>
    </Stack>
  );
}

export default Home;
