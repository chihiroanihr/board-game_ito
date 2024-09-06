import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Box, Grid, styled } from '@mui/material';

import { HeaderLayout } from '@/layouts';
import { Loader, Copyright } from '@/components';
import { useAuth, useGame } from '@/hooks';
import { toolBarStyle } from '../theme';

/** @/debug - Display amount of sockets connected: Only for development environment */
const SocketsConnected = React.lazy(() => import('../components/debug/SocketsConnected'));
/** @/debug - Display amount of sockets logged-in: Only for development environment */
const SocketsLoggedIn = React.lazy(() => import('../components/debug/SocketsLoggedIn'));
/** @/debug - Initialize DB button: Only for development environment */
const Initialize = React.lazy(() => import('../components/debug/Initialize'));

const OffsetAppBar = styled('div')(({ theme }) => theme.mixins.toolbar);

export default function CommonLayout() {
  const { user } = useAuth();
  const { game } = useGame();
  const location = useLocation(); /** @/debug */

  return (
    <Box sx={{ overflowY: 'auto' }} height="100%">
      {/** @todo: Fix mobile browser 100vh problem */}
      <Box height="100vh" display="flex" flexDirection="column" pb="0.5rem">
        {/* -------------- Header -------------- */}
        {user && (
          <>
            <AppBar component="header">
              <Toolbar sx={toolBarStyle}>
                <HeaderLayout />
              </Toolbar>
            </AppBar>

            <OffsetAppBar />
          </>
        )}

        {/* -------------- Main -------------- */}
        <Grid
          container
          component="main"
          flexGrow={1}
          position="relative"
          p={{ xs: '1.4rem', lg: '2%' }}
        >
          {/* Main Layout */}
          <Grid
            id="main_outlet-wrapper"
            item
            display="flex"
            flexGrow={1} // grid item width
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <Outlet />
          </Grid>
        </Grid>

        {/* -------------- Footer -------------- */}
        {!game && (
          <Box component="footer" mt="0.5rem">
            <Copyright />
          </Box>
        )}
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
    </Box>
  );
}
