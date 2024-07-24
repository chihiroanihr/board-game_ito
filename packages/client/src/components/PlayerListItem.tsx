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
import { Block as BlockIcon } from '@mui/icons-material';

import { type User } from '@bgi/shared';

import { OnlineBadgeStyled } from './styled';
import { avatarBgColor } from '@/utils';

interface PlayerListItemProps {
  player: User;
  adminId: ObjectId | undefined;
  myselfId: ObjectId | undefined;
}

const PlayerListItem: React.FC<PlayerListItemProps> = ({ player, adminId, myselfId }) => {
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');

  const handleOpenPlayerDialog = () => {
    setPlayerDialogOpen(true);
  };

  const handleClosePlayerDialog = () => {
    setPlayerDialogOpen(false);
  };

  const handleConfirmDialogOpen = (action: string) => {
    setActionType(action);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialogOpen(false);
  };

  const handleManagePlayerAction = () => {
    switch (actionType) {
      case 'kick':
        // Kick player logic
        console.log(`Kicked player ${player.name}`);
        break;
      case 'ban':
        // Ban player logic
        console.log(`Banned player ${player.name}`);
        break;
      case 'admin':
        // Change admin logic
        console.log(`Changed admin to ${player.name}`);
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
          {/* {myselfId?.toString() === adminId?.toString() &&
            myselfId?.toString() !== player._id.toString() && (
              <BlockIcon sx={{ color: 'primary.light' }} />
            )} */}
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
            <Button
              onClick={() => handleConfirmDialogOpen('admin')}
              variant="contained"
              color="warning"
              disableElevation
              sx={{ fontWeight: 600 }}
            >
              Make this player an admin
            </Button>
            <Button
              onClick={() => handleConfirmDialogOpen('kick')}
              variant="contained"
              color="error"
              disableElevation
              sx={{ fontWeight: 600 }}
            >
              Kick this player
            </Button>
            <Button
              onClick={() => handleConfirmDialogOpen('ban')}
              variant="contained"
              color="error"
              disableElevation
              sx={{ fontWeight: 600 }}
            >
              Ban this player
            </Button>
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
          <Typography variant="body1">Are you sure you want to kick {player.name}?</Typography>
        </DialogContent>

        {/* Dialog action buttons */}
        <DialogActions>
          <Button onClick={handleManagePlayerAction} color="secondary">
            Yes
          </Button>
          <Button onClick={handleConfirmDialogClose} color="primary">
            No
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PlayerListItem;
