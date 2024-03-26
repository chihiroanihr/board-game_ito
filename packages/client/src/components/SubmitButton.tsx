import React from 'react';
import { Button, type ButtonProps, CircularProgress } from '@mui/material';

interface SubmitButtonProps extends Omit<ButtonProps, 'startIcon'> {
  loading: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({
  onClick,
  type,
  variant,
  disabled,
  loading,
  children,
  ...rest
}) => {
  return (
    <Button
      onClick={onClick}
      type={type}
      variant={variant}
      disabled={disabled || loading}
      startIcon={loading && <CircularProgress size={20} color="inherit" />}
      {...rest}
    >
      {loading ? 'Loading...' : children}
    </Button>
  );
};

export default SubmitButton;
