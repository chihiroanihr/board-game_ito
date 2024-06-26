import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Stack } from '@mui/material';

import { TextButton } from '@/components';
import { useSubmissionStatus } from '@/hooks';
import { navigateJoinRoom, navigateCreateRoom } from '@/utils';

/**
 * Main page for Dashboard
 * @returns
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const { setIsSubmitting } = useSubmissionStatus();

  const processButtonStatus = (status: boolean) => {
    setIsLoading(status);
    setIsSubmitting(status);
  };

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const joinRoomHandler = () => {
    processButtonStatus(true);
    navigateJoinRoom(navigate);
    processButtonStatus(false);
  };

  const createRoomHandler = () => {
    processButtonStatus(true);
    navigateCreateRoom(navigate);
    processButtonStatus(false);
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="flex-start" gap={2}>
      <Typography variant="h4" component="h2">
        Choose an option
      </Typography>

      <Stack direction="row" alignItems="center" spacing={2}>
        {/* Create Room Button */}
        <TextButton
          onClick={joinRoomHandler}
          variant="contained"
          loading={isLoading}
          loadingElement="Loading..."
        >
          Join Room
        </TextButton>

        {/* Create Room Button */}
        <TextButton
          onClick={createRoomHandler}
          variant="contained"
          loading={isLoading}
          loadingElement="Loading..."
        >
          Create Room
        </TextButton>
      </Stack>
    </Box>
  );
}
