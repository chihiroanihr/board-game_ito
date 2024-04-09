import React, { useState } from 'react';
import { Fab } from '@mui/material';
import { Mic as MicIcon } from '@mui/icons-material';

const VoiceButton = () => {
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const handleToggleMic = () => {
    setIsMuted((prevState) => !prevState);
  };

  return (
    <Fab
      component="button"
      color="primary"
      aria-describedby={isMuted ? 'mic-button' : undefined}
      onClick={handleToggleMic}
    >
      <MicIcon sx={{ width: 'unset', height: 'unset', p: '0.6rem' }} />
    </Fab>
  );
};

export default VoiceButton;
