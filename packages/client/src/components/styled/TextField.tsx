import { TextField, styled } from '@mui/material';

export const TextFieldWithIcon = styled(TextField)(({ theme }) => ({
  '& .MuiFormLabel-root': {
    display: 'flex',
    alignItems: 'center',
    '& .MuiSvgIcon-root ': {
      marginLeft: theme.spacing(0.5),
      // order: 999,
    },
  },
}));
