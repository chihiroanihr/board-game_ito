import { createTheme } from '@mui/material';
import { red } from '@mui/material/colors';

// Module augmentation
declare module '@mui/material/styles' {
  interface BreakpointOverrides {
    // xs: false; // 0px // removes the `xs` breakpoint
    // sm: false; // 600px
    // md: false; // 900px
    // lg: false; // 1200px
    // xl: false; // 1536px
    // mobile: true; // adds the `mobile` breakpoint
    // tablet: true;
    // laptop: true;
    // desktop: true;
  }
}

// A custom theme for this app
let theme = createTheme({
  // breakpoints: {
  //   values: {
  //     mobile: 0,
  //     tablet: 640,
  //     laptop: 1024,
  //     desktop: 1200,
  //   },
  // },
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
    MuiButton: {
      styleOverrides: {
        startIcon: { marginLeft: 0, marginRight: 0 },
      },
    },
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

export const commonIconButtonStyle = {
  bgcolor: 'primary.main',
  color: 'background.default',
  '&:hover': {
    bgcolor: 'primary.dark', // Background color on hover
  },
};
