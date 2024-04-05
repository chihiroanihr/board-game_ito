// SnackbarPlayerOut.js
import React from 'react';
import { Stack, Snackbar, Slide, Avatar, useTheme, type SlideProps } from '@mui/material';
import { Login, Logout, ManageHistory, CheckCircleOutline } from '@mui/icons-material';

import { SnackbarPlayerInfoType } from '../enum';

const SNACKBAR_DURATION = 5000;

function SlideFromRight(props: React.JSX.IntrinsicAttributes & SlideProps) {
  return <Slide {...props} direction="right" />;
}

function SlideFromDown(props: React.JSX.IntrinsicAttributes & SlideProps) {
  return <Slide {...props} direction="down" />;
}

interface SnackbarPlayerProps {
  open: boolean;
  snackbarInfo: SnackbarPlayerInfoType;
  onClose: () => void;
  onExited: () => void;
}

export const SnackbarPlayer: React.FC<SnackbarPlayerProps> = ({
  open,
  snackbarInfo,
  onClose,
  onExited,
}) => {
  const theme = useTheme();

  return (
    <Snackbar
      key={snackbarInfo ? snackbarInfo.key : undefined}
      open={open}
      onClose={onClose}
      TransitionProps={{ onExited: onExited }}
      TransitionComponent={SlideFromRight}
      autoHideDuration={SNACKBAR_DURATION}
      message={
        <Stack direction="row" alignItems="center" spacing={1}>
          {snackbarInfo?.status === 'in' && (
            <>
              <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                <Login />
              </Avatar>
              <span>{`${snackbarInfo?.player.name} just joined.`}</span>
            </>
          )}
          {snackbarInfo?.status === 'out' && (
            <>
              <Avatar sx={{ bgcolor: theme.palette.error.main }}>
                <Logout />
              </Avatar>
              <span>{`${snackbarInfo?.player.name} just left.`}</span>
            </>
          )}
        </Stack>
      }
    />
  );
};

interface SnackbarRoomEditedProps {
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

export const SnackbarRoomEdited: React.FC<SnackbarRoomEditedProps> = ({
  open,
  onClose,
  isAdmin,
}) => {
  const theme = useTheme();

  return (
    <Snackbar
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      open={open}
      onClose={onClose}
      TransitionComponent={SlideFromDown}
      autoHideDuration={SNACKBAR_DURATION}
      message={
        <Stack direction="row" alignItems="center" spacing={1}>
          {isAdmin ? (
            <>
              <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                <CheckCircleOutline />
              </Avatar>
              <span>Successfully changed the room setting.</span>
            </>
          ) : (
            <>
              <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                <ManageHistory />
              </Avatar>
              <span>Admin has changed the room setting.</span>
            </>
          )}
        </Stack>
      }
    />
  );
};
