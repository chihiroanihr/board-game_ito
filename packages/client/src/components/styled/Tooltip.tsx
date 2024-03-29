import React from 'react';
import { styled, Tooltip, type TooltipProps, tooltipClasses, useTheme } from '@mui/material';

const TooltipStyled = styled(({ className, ...props }: TooltipProps) => {
  const theme = useTheme();
  return (
    <Tooltip
      {...props}
      classes={{ popper: className }}
      slotProps={{
        popper: {
          sx: {
            [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]:
              {
                marginTop: theme.spacing(1),
              },
            [`&.${tooltipClasses.popper}[data-popper-placement*="top"] .${tooltipClasses.tooltip}`]:
              {
                marginBottom: theme.spacing(1),
              },
            [`&.${tooltipClasses.popper}[data-popper-placement*="right"] .${tooltipClasses.tooltip}`]:
              {
                marginLeft: theme.spacing(1),
              },
            [`&.${tooltipClasses.popper}[data-popper-placement*="left"] .${tooltipClasses.tooltip}`]:
              {
                marginRight: theme.spacing(1),
              },
          },
        },
      }}
      arrow
    />
  );
})(({ theme }) => ({
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.grey,
  },
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.grey,
  },
}));

export default TooltipStyled;
