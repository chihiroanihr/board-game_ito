import { Snackbar, styled } from '@mui/material';

const SnackbarStyled = styled(Snackbar)(({ theme }) => ({
  '& .MuiSnackbarContent-root': {
    [theme.breakpoints.down('md')]: {
      flexGrow: 0,
    },
  },
}));

export default SnackbarStyled;
