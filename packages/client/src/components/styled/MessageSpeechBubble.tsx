import { styled, Typography, TypographyProps } from '@mui/material';

// Define the prop type, extending from TypographyProps
interface MessageSpeechBubbleProps extends TypographyProps {
  bgcolor?: string; // Optional bgcolor prop
}

const MessageSpeechBubble = styled(Typography)<MessageSpeechBubbleProps>(({ theme, bgcolor }) => ({
  position: 'relative',
  borderRadius: '0 1rem 1rem 1rem',
  padding: '0.5rem 0.875rem',
  backgroundColor: bgcolor || theme.palette.grey[200], // Use bgcolor or fallback

  '&:before, &:after': {
    top: 0,
    left: '-1rem',
    content: "''",
    height: '1rem',
    position: 'absolute',
  },

  '&:before': {
    borderLeft: `1rem solid ${bgcolor || theme.palette.grey[200]}`, // Use bgcolor or fallback
  },

  '&:after': {
    backgroundColor: theme.palette.background.default,
    borderTopRightRadius: '0.5rem',
    width: '1rem',
  },
}));

export default MessageSpeechBubble;
