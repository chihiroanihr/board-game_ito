import React from 'react';
import { Stack, Slide, Avatar, useTheme, type SlideProps } from '@mui/material';
import {
  Login,
  Logout,
  AdminPanelSettings,
  NoMeetingRoom,
  Block,
  ManageHistory,
  CheckCircleOutline,
} from '@mui/icons-material';

import { SnackbarStyled } from './styled';
import {
  PlayerInQueueActionEnum,
  type SnackbarPlayerInQueueInfoType,
  RoomEditedActionEnum,
  type SnackbarRoomEditedInfoType,
} from '../enum';

const SNACKBAR_DURATION = 5000;

function SlideFromRight(props: React.JSX.IntrinsicAttributes & SlideProps) {
  return <Slide {...props} direction="right" />;
}

function SlideFromDown(props: React.JSX.IntrinsicAttributes & SlideProps) {
  return <Slide {...props} direction="down" />;
}

interface SnackbarPlayerInQueueProps {
  open: boolean;
  snackbarInfo: SnackbarPlayerInQueueInfoType;
  onClose: () => void;
  onExited: () => void;
}

export const SnackbarPlayerInQueue: React.FC<SnackbarPlayerInQueueProps> = ({
  open,
  snackbarInfo,
  onClose,
  onExited,
}) => {
  const theme = useTheme();

  return (
    <SnackbarStyled
      key={snackbarInfo ? snackbarInfo.key : undefined}
      open={open}
      onClose={onClose}
      TransitionProps={{ onExited: onExited }}
      TransitionComponent={SlideFromRight}
      autoHideDuration={SNACKBAR_DURATION}
      sx={{ bottom: { xs: '1.4rem', lg: undefined } }}
      message={
        <Stack direction="row" alignItems="center" spacing={1}>
          {snackbarInfo?.status === PlayerInQueueActionEnum.IN && (
            <>
              <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                <Login />
              </Avatar>
              <span>{`${snackbarInfo?.player.name} just joined.`}</span>
            </>
          )}
          {snackbarInfo?.status === PlayerInQueueActionEnum.OUT && (
            <>
              <Avatar sx={{ bgcolor: theme.palette.error.main }}>
                <Logout />
              </Avatar>
              <span>{`${snackbarInfo?.player.name} just left.`}</span>
            </>
          )}
          {snackbarInfo?.status === PlayerInQueueActionEnum.KICK && (
            <>
              <Avatar sx={{ bgcolor: theme.palette.error.main }}>
                <NoMeetingRoom />
              </Avatar>
              <span>{`${snackbarInfo?.player.name} got kicked by an admin.`}</span>
            </>
          )}
          {snackbarInfo?.status === PlayerInQueueActionEnum.BAN && (
            <>
              <Avatar sx={{ bgcolor: theme.palette.error.main }}>
                <Block />
              </Avatar>
              <span>{`${snackbarInfo?.player.name} got banned by an admin.`}</span>
            </>
          )}
        </Stack>
      }
    />
  );
};

interface SnackbarRoomEditedProps {
  open: boolean;
  isAdmin: boolean;
  snackbarInfo: SnackbarRoomEditedInfoType;
  onClose: () => void;
  onExited: () => void;
}

export const SnackbarRoomEdited: React.FC<SnackbarRoomEditedProps> = ({
  open,
  isAdmin,
  snackbarInfo,
  onClose,
  onExited,
}) => {
  const theme = useTheme();

  return (
    <SnackbarStyled
      key={snackbarInfo ? snackbarInfo.key : undefined}
      open={open}
      onClose={onClose}
      TransitionProps={{ onExited: onExited }}
      TransitionComponent={SlideFromDown}
      autoHideDuration={SNACKBAR_DURATION}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      message={
        <Stack direction="row" alignItems="center" spacing={1}>
          {snackbarInfo?.status === RoomEditedActionEnum.EDIT &&
            (isAdmin ? (
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
            ))}
          {snackbarInfo?.status === RoomEditedActionEnum.ADMIN && (
            <>
              <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                <AdminPanelSettings />
              </Avatar>
              <span>{`${snackbarInfo?.player?.name} became a new admin.`}</span>
            </>
          )}
        </Stack>
      }
    />
  );
};
