import React from 'react';
import { Fab, Popper, Paper, Typography, Grow } from '@mui/material';
import { Chat as ChatIcon } from '@mui/icons-material';

import { NotificationBadge } from '@/components';

const CHAT_POPPER_STYLE = { width: '30%', minWidth: '280px' };
const CHAT_POPPER_CORNER_RADIUS = '0.25rem';
const CHAT_POPPER_DISTANCE_FROM_BOTTOM = '0.5rem';

interface ChatPopperProps {
  numNotif: number;
  anchorEl: HTMLButtonElement | null;
  isOpen: boolean;
  handleToggle: () => void;
  children: React.ReactNode;
}

const ChatPopper: React.FC<ChatPopperProps> = ({
  numNotif,
  anchorEl,
  isOpen,
  handleToggle,
  children,
}) => {
  return (
    <>
      <NotificationBadge badgeContent={numNotif}>
        <Fab
          component="button"
          color="primary"
          aria-describedby={isOpen ? 'chat-popper' : undefined}
          onClick={handleToggle}
        >
          <ChatIcon sx={{ width: 'unset', height: 'unset', p: '0.7rem' }} />
        </Fab>
      </NotificationBadge>

      <Popper
        open={isOpen}
        anchorEl={anchorEl}
        placement="top-end"
        sx={{ ...CHAT_POPPER_STYLE, pb: CHAT_POPPER_DISTANCE_FROM_BOTTOM }}
      >
        <Grow in={isOpen} timeout={200}>
          <Paper elevation={8} sx={{ borderRadius: CHAT_POPPER_CORNER_RADIUS, overflow: 'hidden' }}>
            <Typography
              variant="body1"
              component="div"
              bgcolor="primary.main"
              color="primary.contrastText"
              sx={{ p: 1.4 }}
            >
              Room Chat
            </Typography>

            {/* Chat Content */}
            {children}
          </Paper>
        </Grow>
      </Popper>
    </>
  );
};

export default ChatPopper;
