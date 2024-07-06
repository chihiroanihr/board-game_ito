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

import { userNameConfig, NamespaceEnum } from '@bgi/shared';

import { TextButton } from '@/components';
import {
  useAuth,
  useAction,
  type BeforeSubmitCallbackParams,
  type BeforeSubmitCallbackFunction,
  type ErrorCallbackParams,
  type ErrorCallbackFunction,
  type SuccessCallbackParams,
  type SuccessCallbackFunction,
} from '@/hooks';
import { navigateDashboard } from '@/utils';
import { type LoginFormDataType } from '../enum';

/**
 * Main page for Home
 * @returns
 */
function Home() {
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

  // Callback for button click handlers
  const beforeSubmit: BeforeSubmitCallbackFunction = ({ action }: BeforeSubmitCallbackParams) => {};
  const onError: ErrorCallbackFunction = ({ action }: ErrorCallbackParams) => {};
  const onSuccess: SuccessCallbackFunction = ({
    action,
    user: updatedUser,
  }: SuccessCallbackParams) => {
    switch (action) {
      case NamespaceEnum.LOGIN:
        updateUser(updatedUser ? updatedUser : null); // Login and save user info to local storage
        navigateDashboard(navigate); // Navigate
        break;
      default:
        console.error('[!] Unknown action: ', action);
    }
  };

  // Button click handlers
  const { handleLogin, loadingButton, errorMessage, setErrorMessage } = useAction({
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

  if (user) return null;
  return (
    <Stack spacing={'1.4rem'} flexGrow={1} alignItems="center">
      <Typography variant="h3" component="h1" fontSize={{ xs: '2rem', md: '2.5rem' }}>
        Welcome to ITO Game
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit(handleLogin)}
        noValidate
      >
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
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      </Box>
    </Stack>
  );
}

export default Home;
