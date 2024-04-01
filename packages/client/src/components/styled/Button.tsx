import React from 'react';
import {
  type TooltipProps,
  IconButton,
  Button,
  type ButtonProps,
  type IconButtonProps,
  CircularProgress,
} from '@mui/material';

import { TooltipStyled } from '@/components';
import { useSubmissionStatus } from '@/hooks';

// https://github.com/mui/material-ui/issues/32420

interface TextButtonStyledProps extends Omit<ButtonProps, 'startIcon'> {
  loading?: boolean;
}

interface IconButtonStyledProps extends IconButtonProps {
  loading?: boolean;
  tooltipProps?: Partial<TooltipProps> & { bgColor?: string; textColor?: string };
}

const TextButtonStyled = React.forwardRef(function TextButtonStyled(
  props: TextButtonStyledProps,
  ref: React.Ref<HTMLButtonElement>
) {
  // Destructure all props
  const { onClick, type, variant, disabled, loading, children, ...rest } = props;

  const { isSubmitting } = useSubmissionStatus();

  return (
    <Button
      ref={ref}
      onClick={onClick}
      type={type}
      variant={variant}
      disabled={disabled || isSubmitting || loading}
      startIcon={loading && <CircularProgress color="inherit" size={20} />}
      {...rest}
    >
      {loading ? 'Loading...' : children}
    </Button>
  );
}) as React.ForwardRefExoticComponent<
  TextButtonStyledProps & React.RefAttributes<HTMLButtonElement>
>;

const IconButtonStyled = React.forwardRef(function TextButtonStyled(
  props: IconButtonStyledProps,
  ref: React.Ref<HTMLButtonElement>
) {
  // Destructure all props
  const { onClick, type, disabled, loading, tooltipProps, children, ...rest } = props;
  // Destructure title, bgColor and textColor from tooltipProps if they exist
  const { title, bgColor, textColor, ...otherProps } = tooltipProps || {};

  const { isSubmitting } = useSubmissionStatus();

  return (
    <TooltipStyled title={title} bgColor={bgColor} textColor={textColor} {...otherProps}>
      <span>
        <IconButton
          ref={ref}
          onClick={onClick}
          type={type}
          disabled={disabled || isSubmitting || loading}
          {...rest}
        >
          {loading ? (
            <CircularProgress color="inherit" size={25} sx={{ padding: '0.1em' }} />
          ) : (
            children
          )}
        </IconButton>
      </span>
    </TooltipStyled>
  );
}) as React.ForwardRefExoticComponent<
  IconButtonStyledProps & React.RefAttributes<HTMLButtonElement>
>;

export { TextButtonStyled, IconButtonStyled };
