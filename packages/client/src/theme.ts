import { createTheme } from '@mui/material';
import { red } from '@mui/material/colors';

// A custom theme for this app
let theme = createTheme({
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

// Theme composition: using theme options to define other options (https://mui.com/material-ui/customization/theming/)
theme = createTheme(theme, {
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          ':disabled': {
            color: theme.palette.action.disabled,
            backgroundColor: theme.palette.action.disabledBackground,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          ':disabled': {
            color: theme.palette.action.disabled,
            backgroundColor: theme.palette.action.disabledBackground,
          },
        },
      },
    },
  },
});

export default theme;
