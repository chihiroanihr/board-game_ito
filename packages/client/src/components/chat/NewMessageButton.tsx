import React from 'react';
import { Button, Typography } from '@mui/material';
import { ArrowCircleRight as ArrowCircleRightIcon } from '@mui/icons-material';

interface NewMessageButtonProps {
  toggleDisplay: boolean;
  numNewMessages: number;
  onClick: () => void;
}

const NewMessageButton: React.FC<NewMessageButtonProps> = ({
  toggleDisplay,
  numNewMessages,
  onClick,
}) => {
  return (
    <Button
      variant="contained"
      color="info"
      size="small"
      onClick={onClick}
      sx={{
        position: 'absolute',
        bottom: '4%',
        left: '50%',
        transform: 'translateX(-50%)',
        borderRadius: '1rem',
        opacity: toggleDisplay ? 1 : 0,
        pointerEvents: toggleDisplay ? 'auto' : 'none',
      }}
    >
      <Typography
        variant="body2"
        component="div"
        sx={{
          marginRight: '0.3rem',
          fontSize: {
            xs: '0.6rem',
            lg: 'unset',
          },
        }}
        noWrap
      >
        {numNewMessages <= 1
          ? 'new message'
          : numNewMessages >= 1000
            ? '999+ messages'
            : numNewMessages + ' new messages'}
      </Typography>
      <ArrowCircleRightIcon
        sx={{
          fontSize: {
            xs: 'small',
            lg: 'large',
          },
          transform: 'rotate(90deg)',
        }}
      />
    </Button>
  );
};

export default NewMessageButton;
