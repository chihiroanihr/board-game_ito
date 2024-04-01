// SnackbarPlayerOut.js
import React from 'react';
import { Snackbar, Slide, Avatar, useTheme, type SlideProps } from '@mui/material';
import { Login, Logout, ManageHistory } from '@mui/icons-material';

import type { User } from '@bgi/shared';

const SNACKBAR_DURATION = 5000;

function SlideFromRight(props: React.JSX.IntrinsicAttributes & SlideProps) {
  return <Slide {...props} direction="right" />;
}

interface SnackbarPlayerInProps {
  open: boolean;
  player: User | undefined;
  onClose: () => void;
}

export const SnackbarPlayerIn: React.FC<SnackbarPlayerInProps> = ({ open, player, onClose }) => {
  const theme = useTheme();

  return (
    <Snackbar
      open={open}
      onClose={onClose}
      TransitionComponent={SlideFromRight}
      autoHideDuration={SNACKBAR_DURATION}
      message={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar sx={{ bgcolor: theme.palette.success.main }}>
            <Login />
          </Avatar>
          <span>{`${player?.name} just joined.`}</span>
        </div>
      }
    />
  );
};

interface SnackbarPlayerOutProps {
  open: boolean;
  player: User | undefined;
  onClose: () => void;
}

export const SnackbarPlayerOut: React.FC<SnackbarPlayerOutProps> = ({ open, player, onClose }) => {
  const theme = useTheme();

  return (
    <Snackbar
      open={open}
      onClose={onClose}
      TransitionComponent={SlideFromRight}
      autoHideDuration={SNACKBAR_DURATION}
      message={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar sx={{ bgcolor: theme.palette.error.main }}>
            <Logout />
          </Avatar>
          <span>{`${player?.name} just left.`}</span>
        </div>
      }
    />
  );
};
