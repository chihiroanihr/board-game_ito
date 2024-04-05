import React from 'react';
import { Typography, Link } from '@mui/material';

function Copyright() {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      px={{ xs: '1.4rem', lg: '2%' }}
      sx={{ fontSize: '0.5rem' }}
    >
      {'Copyright © '}
      <Link color="inherit" href="https://mui.com/">
        Your Website
      </Link>{' '}
      {new Date().getFullYear()}.
    </Typography>
  );
}

export default Copyright;
