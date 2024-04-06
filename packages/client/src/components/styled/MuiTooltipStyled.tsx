import React from 'react';
import { styled, Tooltip, type TooltipProps, tooltipClasses, useTheme } from '@mui/material';

const TooltipStyled = styled(
  ({
    className,
    bgColor,
    textColor,
    ...props
  }: TooltipProps & { bgColor?: string; textColor?: string }) => {
    const theme = useTheme();

    return (
      <Tooltip
        {...props}
        classes={{ popper: className }}
        slotProps={{
          popper: {
            sx: {
              '& .MuiTooltip-tooltip': {
                ...(bgColor && {
                  bgcolor: bgColor,
                }),
                ...(textColor && {
                  color: textColor,
                }),
              },
              '& .MuiTooltip-arrow': {
                ...(bgColor && {
                  color: bgColor,
                }),
              },
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
      >
        {props.children}
      </Tooltip>
    );
  }
)(({ theme }) => ({
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.grey,
  },
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.grey,
  },
}));

export default TooltipStyled;
