import React from 'react';
import { ObjectId } from 'mongodb';
import { ListItem, ListItemAvatar, Avatar, ListItemText, Typography } from '@mui/material';

import { type User } from '@bgi/shared';

import { OnlineBadgeStyled } from './styled';
import { avatarBgColor } from '@/utils';

interface PlayerListItemProps {
  player: User;
  adminId: ObjectId | undefined;
}

const PlayerListItem: React.FC<PlayerListItemProps> = ({ player, adminId }) => {
  return (
    <ListItem>
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
    </ListItem>
  );
};

export default PlayerListItem;
