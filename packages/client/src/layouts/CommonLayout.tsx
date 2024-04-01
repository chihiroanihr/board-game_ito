import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, useTheme } from '@mui/material';

import { HeaderLayout } from '@/layouts';
import { Loader, Copyright } from '@/components';

/** @/debug - Display amount of sockets connected: Only for development environment */
const SocketsConnected = React.lazy(() => import('../components/debug/SocketsConnected'));
/** @/debug - Display amount of sockets logged-in: Only for development environment */
const SocketsLoggedIn = React.lazy(() => import('../components/debug/SocketsLoggedIn'));
/** @/debug - Initialize DB button: Only for development environment */
const Initialize = React.lazy(() => import('../components/debug/Initialize'));

export default function CommonLayout() {
  const theme = useTheme();
  const location = useLocation(); /** @/debug */

  const FOOTER_SPACING = 2;

  return (
    <>
      <Box minHeight="100vh" display="flex" flexDirection="column">
        <Box pt={5} px={4} pb={FOOTER_SPACING} display="flex" flexDirection="column" flexGrow={1}>
          {/* -------------- Header -------------- */}
          <Box component="header" marginBottom={4}>
            <HeaderLayout />
          </Box>
          {/* -------------- Main -------------- */}
          <Box
            component="main"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            flexGrow={1}
          >
            <Outlet />
          </Box>
          {/* -------------- Footer -------------- */}
          <Box component="footer" marginTop={4}>
            <hr
              style={{
                border: 0,
                borderTop: `1px solid ${theme.palette.grey[500]}`,
                marginBlockStart: theme.spacing(FOOTER_SPACING),
                marginBlockEnd: theme.spacing(FOOTER_SPACING),
              }}
            />
            <Copyright />
          </Box>
        </Box>
      </Box>

      {/* {process.env.NODE_ENV === 'development' && (
        <Suspense fallback={<Loader />}>
          <Box>
            <hr />
            {location.pathname === '/' && <Initialize />}
            <SocketsConnected />
            <SocketsLoggedIn />
            <hr />
          </Box>
        </Suspense>
      )} */}
    </>
  );
}
