import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Stack } from '@mui/material';

import { SubmitButton } from '@/components';
import { navigateJoinRoom, navigateCreateRoom } from '@/utils';

/**
 * Main page for Dashboard
 * @returns
 */
export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(false);

  const joinRoomHandler = () => {
    setLoading(true);
    navigateJoinRoom(navigate);
    setLoading(false);
  };

  const createRoomHandler = () => {
    setLoading(true);
    navigateCreateRoom(navigate);
    setLoading(false);
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="flex-start" gap={2}>
      <Typography variant="h4" component="h2">
        Choose an option
      </Typography>

      <Stack direction="row" alignItems="center" spacing={2}>
        {/* Create Room Button */}
        <SubmitButton onClick={joinRoomHandler} variant="contained" loading={loading}>
          Join Room
        </SubmitButton>

        {/* Create Room Button */}
        <SubmitButton onClick={createRoomHandler} variant="contained" loading={loading}>
          Create Room
        </SubmitButton>
      </Stack>
    </Box>
  );
}
