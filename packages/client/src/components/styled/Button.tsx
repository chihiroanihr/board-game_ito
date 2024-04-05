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
  loadingElement?: React.ReactNode;
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
  const { onClick, type, variant, disabled, loading, loadingElement, children, ...rest } = props;

  const { isSubmitting } = useSubmissionStatus();

  return (
    <Button
      ref={ref}
      onClick={onClick}
      type={type}
      variant={variant}
      disabled={disabled || isSubmitting || loading}
      startIcon={
        loading && (
          <CircularProgress
            color="inherit"
            size="1em"
            sx={{ mr: loadingElement ? 1 : 0, p: '0.02rem' }}
          />
        )
      }
      {...rest}
    >
      {loading ? loadingElement : children}
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

  const { isSubmitting } = useSubmissionStatus();

  // Check if tooltipProps exists
  if (tooltipProps) {
    // Destructure title, bgColor, and textColor from tooltipProps if they exist
    const { title, bgColor, textColor, ...otherProps } = tooltipProps;
    // Render IconButton with TooltipStyled
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
              <CircularProgress color="inherit" size="1em" sx={{ p: '0.1rem' }} />
            ) : (
              children
            )}
          </IconButton>
        </span>
      </TooltipStyled>
    );
  }

  // If tooltipProps does not exist, render IconButton without TooltipStyled
  return (
    <IconButton
      ref={ref}
      onClick={onClick}
      type={type}
      disabled={disabled || isSubmitting || loading}
      {...rest}
    >
      {loading ? <CircularProgress color="inherit" size="1em" sx={{ p: '0.1rem' }} /> : children}
    </IconButton>
  );
}) as React.ForwardRefExoticComponent<
  IconButtonStyledProps & React.RefAttributes<HTMLButtonElement>
>;

export { TextButtonStyled, IconButtonStyled };
