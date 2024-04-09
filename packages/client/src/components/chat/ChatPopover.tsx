import React from 'react';
import { Fab, Popover, Typography } from '@mui/material';
import { Chat as ChatIcon } from '@mui/icons-material';

import { NotificationBadge } from '@/components';

const CHAT_POPOVER_SIZE = { width: '60%', minWidth: '250px' };
const CHAT_POPOVER_CORNER_RADIUS = '0.25rem';
const CHAT_POPOVER_DISTANCE_FROM_BOTTOM = '0.5rem';

interface ChatPopoverProps {
  numNotif: number;
  anchorEl: HTMLButtonElement | null;
  isOpen: boolean;
  handleToggle: () => void;
  children: React.ReactNode;
}

const ChatPopover: React.FC<ChatPopoverProps> = ({
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
          aria-describedby={isOpen ? 'chat-popover' : undefined}
          onClick={handleToggle}
        >
          <ChatIcon sx={{ width: 'unset', height: 'unset', p: '0.7rem' }} />
        </Fab>
      </NotificationBadge>

      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleToggle}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        slotProps={{
          paper: { sx: { ...CHAT_POPOVER_SIZE, borderRadius: CHAT_POPOVER_CORNER_RADIUS } },
        }}
        sx={{ mt: `-${CHAT_POPOVER_DISTANCE_FROM_BOTTOM}` }}
      >
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
      </Popover>
    </>
  );
};

export default ChatPopover;
