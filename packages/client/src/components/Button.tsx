import React from 'react';
import {
  type TooltipProps,
  type ButtonProps as MuiButtonProps,
  type IconButtonProps as MuiIconButtonProps,
  IconButton as MuiIconButton,
  Button as MuiButton,
  CircularProgress as MuiCircularProgress,
} from '@mui/material';

import { TooltipStyled } from './styled';
import { useSubmissionStatus } from '@/hooks';

// https://github.com/mui/material-ui/issues/32420

interface TextButtonProps extends Omit<MuiButtonProps, 'startIcon'> {
  loading?: boolean;
  loadingElement?: React.ReactNode;
}

interface IconButtonProps extends MuiIconButtonProps {
  loading?: boolean;
  tooltipProps?: Partial<TooltipProps> & { bgColor?: string; textColor?: string };
}

const TextButton = React.forwardRef(function TextButton(
  props: TextButtonProps,
  ref: React.Ref<HTMLButtonElement>
) {
  // Destructure all props
  const { onClick, type, variant, disabled, loading, loadingElement, children, ...rest } = props;

  const { isSubmitting } = useSubmissionStatus();

  return (
    <MuiButton
      ref={ref}
      onClick={onClick}
      type={type}
      variant={variant}
      disabled={disabled || isSubmitting || loading}
      startIcon={
        loading && (
          <MuiCircularProgress
            color="inherit"
            size="1em"
            sx={{ mr: loadingElement ? 1 : 0, p: '0.02rem' }}
          />
        )
      }
      {...rest}
    >
      {loading ? loadingElement : children}
    </MuiButton>
  );
}) as React.ForwardRefExoticComponent<TextButtonProps & React.RefAttributes<HTMLButtonElement>>;

const IconButton = React.forwardRef(function IconButton(
  props: IconButtonProps,
  ref: React.Ref<HTMLButtonElement>
) {
  // Destructure all props
  const { onClick, type, disabled, loading, tooltipProps, children, ...rest } = props;

  const { isSubmitting } = useSubmissionStatus();

  // Check if tooltipProps exists
  if (tooltipProps) {
    // Destructure title, bgColor, and textColor from tooltipProps if they exist
    const { title, bgColor, textColor, ...otherProps } = tooltipProps;
    // Render IconButton with TooltipStyled
    return (
      <TooltipStyled title={title} bgColor={bgColor} textColor={textColor} {...otherProps}>
        <span>
          <MuiIconButton
            ref={ref}
            onClick={onClick}
            type={type}
            disabled={disabled || isSubmitting || loading}
            {...rest}
          >
            {loading ? (
              <MuiCircularProgress color="inherit" size="1em" sx={{ p: '0.1rem' }} />
            ) : (
              children
            )}
          </MuiIconButton>
        </span>
      </TooltipStyled>
    );
  }

  // If tooltipProps does not exist, render IconButton without TooltipStyled
  return (
    <MuiIconButton
      ref={ref}
      onClick={onClick}
      type={type}
      disabled={disabled || isSubmitting || loading}
      {...rest}
    >
      {loading ? <MuiCircularProgress color="inherit" size="1em" sx={{ p: '0.1rem' }} /> : children}
    </MuiIconButton>
  );
}) as React.ForwardRefExoticComponent<IconButtonProps & React.RefAttributes<HTMLButtonElement>>;

export { TextButton, IconButton };
