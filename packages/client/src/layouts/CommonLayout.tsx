import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';

import { HeaderLayout } from '@/layouts';
import { Loader, Copyright } from '@/components';

/** @/debug - Display amount of sockets connected: Only for development environment */
const SocketsConnected = React.lazy(() => import('../components/debug/SocketsConnected'));
/** @/debug - Display amount of sockets logged-in: Only for development environment */
const SocketsLoggedIn = React.lazy(() => import('../components/debug/SocketsLoggedIn'));
/** @/debug - Initialize DB button: Only for development environment */
const Initialize = React.lazy(() => import('../components/debug/Initialize'));

export default function CommonLayout() {
  const location = useLocation(); /** @/debug */

  return (
    <>
      <Box minHeight="100vh" display="flex" flexDirection="column">
        <Box p={5} display="flex" flexDirection="column" flexGrow={1}>
          <header>
            <HeaderLayout />
          </header>

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

          <Box component="footer">
            <Copyright />
          </Box>
        </Box>
      </Box>

      {process.env.NODE_ENV !== 'production' && (
        <Suspense fallback={<Loader />}>
          <Box>
            <hr />
            {location.pathname === '/' && <Initialize />}
            <SocketsConnected />
            <SocketsLoggedIn />
            <hr />
          </Box>
        </Suspense>
      )}
    </>
  );
}
