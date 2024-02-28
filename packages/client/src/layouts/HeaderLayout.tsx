import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, CircularProgress, Box, Stack } from '@mui/material';

import { useAuth, useRoom, useSocket } from '@/hooks';
import {
  navigateHome,
  navigateDashboard,
  outputServerError,
  outputResponseTimeoutError
} from '@/utils';

/**
 * Layout for Dashboard
 * @returns
 */
export default function HeaderLayout() {
  const navigate = useNavigate();

  const { socket } = useSocket();
  const { user, discardUser } = useAuth();
  const { room, discardRoom } = useRoom();

  const [loading, setLoading] = useState<boolean>(false);

  const handleLogout = () => {
    setLoading(true); // Set loading to true when the request is initiated

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      setLoading(false);
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit('logout', async (error: any) => {
      // socket.emit("logout");

      // Clear the timeout as response is received before timeout
      clearTimeout(timeoutId);

      if (error) {
        outputServerError({ error });
      } else {
        room && discardRoom();
        user && discardUser();
        navigateHome(navigate); // navigate
      }

      setLoading(false); // Set loading to false when the response is received
    });
  };

  const handleLeaveRoom = () => {
    setLoading(true); // Set loading to true when the request is initiated

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      setLoading(false);
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit('leave-room', async (error: any) => {
      // socket.emit("leave-room");

      // Clear the timeout as response is received before timeout
      clearTimeout(timeoutId);

      if (error) {
        outputServerError({ error });
      } else {
        discardRoom();
        navigateDashboard(navigate);
      }

      setLoading(false); // Set loading to false when the response is received
    });
  };

  if (!user) return null;
  return (
    <Box display="flex" flexDirection="column" alignItems="flex-start" gap={2}>
      <Typography variant="h5" component="h3">
        Hello, <b>{user.name}</b>
      </Typography>

      <Stack direction="row" alignItems="center" spacing={2}>
        <Button
          onClick={handleLogout}
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {loading ? 'Loading...' : 'Leave Game'}
        </Button>

        {room && (
          <Button
            onClick={handleLeaveRoom}
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
          >
            {loading ? 'Loading...' : 'Leave Room'}
          </Button>
        )}
      </Stack>
    </Box>
  );
}
