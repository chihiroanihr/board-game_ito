import React, { useState } from 'react';
import { ObjectId } from 'mongodb';
import {
  Stack,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';

import { type User } from '@bgi/shared';

import { OnlineBadgeStyled } from './styled';
import { avatarBgColor } from '@/utils';
import { PlayerInQueueActionEnum, type SnackbarPlayerInfoType } from '../enum';

interface ManagePlayerButtonData {
  action: PlayerInQueueActionEnum;
  color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  text: string;
  confirmMessage: string;
}

// Define the button data array
const managePlayerButtonData: ManagePlayerButtonData[] = [
  {
    action: PlayerInQueueActionEnum.ADMIN,
    color: 'warning',
    text: 'Make this player an admin',
    confirmMessage: 'Are you sure you want to make this player an admin?',
  },
  {
    action: PlayerInQueueActionEnum.KICK,
    color: 'error',
    text: 'Kick this player',
    confirmMessage: 'Are you sure you want to kick this player?',
  },
  {
    action: PlayerInQueueActionEnum.BAN,
    color: 'error',
    text: 'Ban this player',
    confirmMessage: 'Are you sure you want to ban this player?',
  },
];

interface PlayerListItemProps {
  player: User;
  adminId: ObjectId | undefined;
  myselfId: ObjectId | undefined;
  setPlayerSnackbars: React.Dispatch<React.SetStateAction<readonly SnackbarPlayerInfoType[]>>;
}

const PlayerListItem: React.FC<PlayerListItemProps> = ({
  player,
  adminId,
  myselfId,
  setPlayerSnackbars,
}) => {
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  const handleOpenPlayerDialog = () => {
    setPlayerDialogOpen(true);
  };

  const handleClosePlayerDialog = () => {
    setPlayerDialogOpen(false);
  };

  const handleConfirmDialogOpen = (action: string, message: string) => {
    setActionType(action);
    setConfirmMessage(message);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialogOpen(false);
  };

  const handleManagePlayerAction = () => {
    switch (actionType) {
      case PlayerInQueueActionEnum.KICK:
        // Store player and snackbar info for snackbar notification + Add to snackbar queue
        setPlayerSnackbars((prev) => [
          ...prev,
          {
            key: new Date().getTime(),
            player: player,
            status: PlayerInQueueActionEnum.KICK,
          },
        ]);
        break;
      case PlayerInQueueActionEnum.BAN:
        // Store player and snackbar info for snackbar notification + Add to snackbar queue
        setPlayerSnackbars((prev) => [
          ...prev,
          {
            key: new Date().getTime(),
            player: player,
            status: PlayerInQueueActionEnum.BAN,
          },
        ]);
        break;
      case PlayerInQueueActionEnum.ADMIN:
        // Store player and snackbar info for snackbar notification + Add to snackbar queue
        setPlayerSnackbars((prev) => [
          ...prev,
          {
            key: new Date().getTime(),
            player: player,
            status: PlayerInQueueActionEnum.ADMIN,
          },
        ]);
        break;
      default:
        // Handle other actions if needed
        console.log(`Unknown action: ${actionType}`);
    }

    setConfirmDialogOpen(false);
    setPlayerDialogOpen(false);
  };

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton
          sx={{ paddingY: '0.5rem' }}
          onClick={() =>
            myselfId?.toString() === adminId?.toString() &&
            player._id.toString() !== adminId?.toString() &&
            handleOpenPlayerDialog()
          }
        >
          <ListItemAvatar sx={{ pr: '0.8rem' }}>
            <OnlineBadgeStyled
              variant="dot"
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
              <Avatar {...avatarBgColor(player.name)} />
            </OnlineBadgeStyled>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography component="div">
                {player.name}
                {adminId?.toString() === player._id.toString() && (
                  <Typography component="span" fontWeight="bold">
                    {' '}
                    (admin)
                  </Typography>
                )}
              </Typography>
            }
          />
          {myselfId?.toString() === player._id.toString() && (
            <Typography
              variant="overline"
              bgcolor="primary.light"
              color="primary.contrastText"
              fontWeight={600}
              lineHeight={1}
              padding="0.5rem"
              borderRadius="0.3rem"
            >
              myself
            </Typography>
          )}
        </ListItemButton>
      </ListItem>

      {/* ---------- First Dialog ---------- */}
      <Dialog open={playerDialogOpen} onClose={handleClosePlayerDialog}>
        {/* Dialog title and content */}
        <DialogTitle>Player Details</DialogTitle>
        <DialogContent>
          {/* Player Info */}
          <Stack
            direction="row"
            alignItems="center"
            columnGap="0.5rem"
            paddingX="1rem"
            paddingY="0.75rem"
            borderRadius={1}
            bgcolor="grey.200"
            marginBottom="1rem"
          >
            <Avatar {...avatarBgColor(player.name)} />
            <Typography component="div">{player.name}</Typography>
          </Stack>

          {/* Action Buttons */}
          <Stack spacing="0.4rem">
            {managePlayerButtonData.map((button, index) => (
              <Button
                key={index}
                onClick={() => handleConfirmDialogOpen(button.action, button.confirmMessage)}
                variant="contained"
                color={button.color}
                disableElevation
                sx={{ fontWeight: 600 }}
              >
                {button.text}
              </Button>
            ))}
          </Stack>
        </DialogContent>

        {/* Dialog action buttons */}
        <DialogActions>
          <Button onClick={handleClosePlayerDialog} color="primary" sx={{ fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------- Second Dialog ---------- */}
      <Dialog open={confirmDialogOpen} onClose={handleConfirmDialogClose}>
        {/* Dialog title and content */}
        <DialogTitle>Confirmation</DialogTitle>
        <DialogContent>
          <Typography component="div" fontWeight={600}>
            Selected Player:{' '}
            <Typography component="span" fontWeight="inherit" color="primary">
              {player.name}
            </Typography>
          </Typography>
          <Typography component="div">{confirmMessage}</Typography>
        </DialogContent>

        {/* Dialog action buttons */}
        <DialogActions>
          <Button
            onClick={handleManagePlayerAction}
            variant="contained"
            color="primary"
            disableElevation
            sx={{ fontWeight: 600 }}
          >
            Yes
          </Button>
          <Button
            onClick={handleConfirmDialogClose}
            variant="contained"
            color="inherit"
            disableElevation
            sx={{ fontWeight: 600 }}
          >
            No
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PlayerListItem;
