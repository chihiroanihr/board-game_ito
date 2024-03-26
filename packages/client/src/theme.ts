import { createTheme } from '@mui/material';
import { red } from '@mui/material/colors';

// A custom theme for this app
const theme = createTheme({
  palette: {
    primary: {
      main: '#556cd6',
    },
    secondary: {
      main: '#19857b',
    },
    error: {
      main: red.A400,
    },
  },
  components: {
    MuiCardContent: {
      styleOverrides: {
        root: {
          /* Your custom styles here */
          padding: 0,
          '&:last-child': {
            paddingBottom: 0,
          },
        },
      },
    },
  },
});

export default theme;
