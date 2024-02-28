// SnackbarPlayerOut.js
import React, { useEffect } from 'react';

import { Snackbar, Slide, Avatar, useTheme, SlideProps } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';

import { User } from '@bgi/shared';

interface SnackbarPlayerIn {
  open: boolean;
  player: User;
  onClose: () => void;
}

interface SnackbarPlayerOut {
  open: boolean;
  player: User;
  onClose: () => void;
}

function SlideFromRight(props: React.JSX.IntrinsicAttributes & SlideProps) {
  return <Slide {...props} direction="right" />;
}

export function SnackbarPlayerIn({ open, player, onClose }: SnackbarPlayerIn) {
  const theme = useTheme();

  useEffect(() => {
    if (open && player) {
      const timeout = setTimeout(onClose, 3000);
      return () => clearTimeout(timeout);
    }
  }, [open, player, onClose]);

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
}

export function SnackbarPlayerOut({ open, player, onClose }: SnackbarPlayerOut) {
  const theme = useTheme();

  useEffect(() => {
    if (open && player) {
      const timeout = setTimeout(onClose, 3000);
      return () => clearTimeout(timeout);
    }
  }, [open, player, onClose]);

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
}
