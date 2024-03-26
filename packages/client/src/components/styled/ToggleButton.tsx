import { ToggleButton, styled } from '@mui/material';

export const ToggleButtonWithIcon = styled(ToggleButton)(({ theme }) => ({
  '& .MuiSvgIcon-root ': {
    marginRight: theme.spacing(0.3),
    // order: 999,
  },
}));
