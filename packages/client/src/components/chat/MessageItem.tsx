import React from 'react';
import { ListItem, ListItemAvatar, Avatar, Stack, ListItemText, Typography } from '@mui/material';

import { type RoomChatMessage } from '@bgi/shared';

import { useAuth } from '@/hooks';
import { avatarBgColor, avatarTextColor, computeRelativeTime } from '@/utils';

const MessageItem: React.FC<RoomChatMessage> = ({ fromUser, message, timestamp }) => {
  const { user } = useAuth();

  return (
    <ListItem sx={{ px: 0, py: '2.5%' }}>
      {/* Avatar */}
      <ListItemAvatar sx={{ alignSelf: 'flex-start', pr: '0.8rem' }}>
        <Avatar {...avatarBgColor(fromUser.name)} sizes="small" />
      </ListItemAvatar>

      {/* Message content */}
      <Stack width="100%">
        {/* Name and Timestamp */}
        <ListItemText
          id="message-item_name-and-timestamp_wrapper"
          sx={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginTop: 0,
            marginBottom: '0.5%',
          }}
          primary={
            <Typography
              id="message-item_user-name"
              {...avatarTextColor(fromUser.name)}
              variant="body2"
              component="div"
              fontWeight={500}
            >
              {fromUser._id.toString() === user._id.toString() // If your message
                ? 'You'
                : fromUser.name}
            </Typography>
          }
          secondary={
            <Typography
              id="message-item_sent-timestamp"
              variant="body2"
              component="div"
              color="grey.500"
              fontSize="0.7rem"
            >
              {computeRelativeTime(timestamp)}
            </Typography>
          }
        />

        {/* Message */}
        <Typography id="message-item_sent-message" variant="body2" component="p">
          {message}
        </Typography>
      </Stack>
    </ListItem>
  );
};

export default MessageItem;
