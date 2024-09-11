import React from 'react';
import { ListItem, ListItemAvatar, Stack, ListItemText, Typography } from '@mui/material';

import { type RoomChatMessage } from '@bgi/shared';

import { MessageSpeechBubble, PlayerAvatar } from '@/components';
import { useAuth, useRoom } from '@/hooks';
import { getUserTextColor, usernameToColor, computeRelativeTime } from '@/utils';

const MessageItem: React.FC<RoomChatMessage> = ({ fromUser, message, timestamp }) => {
  const { user } = useAuth();
  const { room } = useRoom();

  return (
    <ListItem alignItems="flex-start" sx={{ px: 0, py: '1.8%' }}>
      {/* Avatar */}
      <ListItemAvatar sx={{ mt: 0, pr: '0.625rem', zIndex: 1 }}>
        <PlayerAvatar player={fromUser} sizes="small" />
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
              {...getUserTextColor(fromUser.name)}
              variant="body2"
              component="div"
              fontWeight={600}
            >
              {fromUser._id.toString() === user._id.toString() // If your message
                ? 'You'
                : fromUser.name}
              {
                fromUser._id.toString() === room.roomAdmin.toString() && ' (admin)' // If admin
              }
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
        <MessageSpeechBubble
          id="message-item_sent-message"
          variant="body2"
          component="p"
          bgcolor={
            fromUser._id.toString() === user._id.toString() && // If your message
            usernameToColor(fromUser.name, 0.1)
          }
        >
          {message}
        </MessageSpeechBubble>
      </Stack>
    </ListItem>
  );
};

export default MessageItem;
