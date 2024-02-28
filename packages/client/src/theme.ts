import { createTheme, styled } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import CardContent from '@mui/material/CardContent';

// A custom theme for this app
const theme = createTheme({
  palette: {
    primary: {
      main: '#556cd6'
    },
    secondary: {
      main: '#19857b'
    },
    error: {
      main: red.A400
    }
  }
});

export const CardContentOverride = styled(CardContent)(`
  padding: 0;
  &:last-child {
    padding-bottom: 0;
  }
`);

export default theme;
