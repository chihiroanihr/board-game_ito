// SnackbarPlayerOut.js
import React, { useEffect } from 'react';

import { Snackbar, Slide, Avatar, useTheme, type SlideProps } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';

import type { User } from '@bgi/shared';

interface SnackbarPlayerInProps {
  open: boolean;
  player: User | undefined;
  onClose: () => void;
}

interface SnackbarPlayerOutProps {
  open: boolean;
  player: User | undefined;
  onClose: () => void;
}

function SlideFromRight(props: React.JSX.IntrinsicAttributes & SlideProps) {
  return <Slide {...props} direction="right" />;
}

export const SnackbarPlayerIn: React.FC<SnackbarPlayerInProps> = ({ open, player, onClose }) => {
  const theme = useTheme();

  useEffect(() => {
    if (open && player) {
      const timeout = setTimeout(onClose, 3000);
      return () => clearTimeout(timeout);
    }
  }, [open, player, onClose]);

  if (!player) return;
  return (
    <Snackbar
      open={open && !!player}
      onClose={onClose}
      TransitionComponent={SlideFromRight}
      autoHideDuration={3000}
      message={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar sx={{ bgcolor: theme.palette.success.main }}>
            <LoginIcon />
          </Avatar>
          <span>{`${player?.name} just joined.`}</span>
        </div>
      }
    />
  );
};

export const SnackbarPlayerOut: React.FC<SnackbarPlayerOutProps> = ({ open, player, onClose }) => {
  const theme = useTheme();

  useEffect(() => {
    if (open && player) {
      const timeout = setTimeout(onClose, 3000);
      return () => clearTimeout(timeout);
    }
  }, [open, player, onClose]);

  if (!player) return;
  return (
    <Snackbar
      open={open && !!player}
      onClose={onClose}
      TransitionComponent={SlideFromRight}
      autoHideDuration={3000}
      message={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar sx={{ bgcolor: theme.palette.error.main }}>
            <LogoutIcon />
          </Avatar>
          <span>{`${player?.name} just left.`}</span>
        </div>
      }
    />
  );
};
