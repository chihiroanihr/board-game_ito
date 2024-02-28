import { styled, Badge, Theme } from '@mui/material';

// The theme object is meant to be used internally within the styled component to access properties of the MUI theme.
// You shouldn't pass the theme prop manually when using the styled component.
const BadgeOnline = styled(Badge)(({ theme }: { theme: Theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""'
    }
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1
    },
    '100%': {
      transform: 'scale(2)',
      opacity: 0
    }
  }
}));

export default BadgeOnline;
