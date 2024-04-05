import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, Grid, useMediaQuery, useTheme } from '@mui/material';

import { CommunicationMethodEnum } from '@bgi/shared';

import { HeaderLayout, CommunicationLayout } from '@/layouts';
import { Loader, Copyright } from '@/components';
import { useAuth, useRoom } from '@/hooks';

/** @/debug - Display amount of sockets connected: Only for development environment */
const SocketsConnected = React.lazy(() => import('../components/debug/SocketsConnected'));
/** @/debug - Display amount of sockets logged-in: Only for development environment */
const SocketsLoggedIn = React.lazy(() => import('../components/debug/SocketsLoggedIn'));
/** @/debug - Initialize DB button: Only for development environment */
const Initialize = React.lazy(() => import('../components/debug/Initialize'));

export default function CommonLayout() {
  const theme = useTheme();
  const { user } = useAuth();
  const { room } = useRoom();
  const location = useLocation(); /** @/debug */

  const isLgViewport = useMediaQuery(theme.breakpoints.up('lg'));

  const communicationMethod = room?.setting.communicationMethod;

  return (
    <Box>
      <Box height="100vh" display="flex" flexDirection="column" pb="0.5rem">
        {/* -------------- Header -------------- */}
        {user && (
          <Box
            component="header"
            mb={{ xs: '1.4rem', lg: '2%' }}
            px={{ xs: '1.4rem', lg: '2%' }}
            py="0.8rem"
            borderBottom="2px solid"
            borderColor="grey.300"
          >
            <HeaderLayout />
          </Box>
        )}

        {/* -------------- Main -------------- */}
        <Grid
          container
          component="main"
          flexGrow={1}
          position="relative"
          height="100%"
          px={{ xs: '1.4rem', lg: '2%' }}
          sx={{ overflowY: 'hidden' }}
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

          {/* Communication Method Layout */}
          {communicationMethod && (
            <Grid
              id="communication-wrapper"
              item
              xs={3.6} // grid item width
              sx={{
                ...(isLgViewport && communicationMethod === CommunicationMethodEnum.CHAT
                  ? { display: 'flex', height: '100%', ml: '2rem' } // Only when chat option + viewport > large, grow horizontally
                  : {
                      position: 'fixed',
                      bottom: '1.4rem',
                      right: { xs: '1.4rem', lg: '2%' },
                    }), // Otherwise, fixed position with chat / mic button on the bottom-left
              }}
            >
              <CommunicationLayout />
            </Grid>
          )}
        </Grid>

        {/* -------------- Footer -------------- */}
        <Box component="footer" mt="1rem">
          <Copyright />
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
    </Box>
  );
}
