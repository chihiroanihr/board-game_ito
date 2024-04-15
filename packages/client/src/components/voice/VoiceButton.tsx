import React from 'react';
import { Fab } from '@mui/material';
import { Mic as MicOnIcon, MicOff as MicOffIcon } from '@mui/icons-material';

interface VoiceButtonProps {
  isMuted: boolean;
  disabled: boolean;
  onClick: () => void;
}

const VoiceButton = ({ isMuted, disabled, onClick }: VoiceButtonProps) => {
  return (
    <Fab
      component="button"
      color="primary"
      aria-describedby={isMuted ? 'mic-button' : undefined}
      disabled={disabled}
      onClick={onClick}
    >
      {isMuted ? <MicOffIcon fontSize="large" /> : <MicOnIcon fontSize="large" color="error" />}
    </Fab>
  );
};
// sx={{ width: 'unset', height: 'unset', p: '0.6rem' }}

export default VoiceButton;
