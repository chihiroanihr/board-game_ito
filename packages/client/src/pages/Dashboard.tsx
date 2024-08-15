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

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const processPreFormSubmission = (status: boolean) => {
    setIsLoading(status);
    setIsSubmitting(status);
  };

  const joinRoomHandler = () => {
    processPreFormSubmission(true);
    navigateJoinRoom(navigate);
    processPreFormSubmission(false);
  };

  const createRoomHandler = () => {
    processPreFormSubmission(true);
    navigateCreateRoom(navigate);
    processPreFormSubmission(false);
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
