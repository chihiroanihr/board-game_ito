import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Box, Grid, useMediaQuery, useTheme, styled } from '@mui/material';

import { CommunicationMethodEnum } from '@bgi/shared';

import { HeaderLayout, ChatLayout, VoiceCallLayout } from '@/layouts';
import { Loader, Copyright } from '@/components';
import { useAuth, useRoom } from '@/hooks';
import { appBarStyle } from '../theme';

/** @/debug - Display amount of sockets connected: Only for development environment */
const SocketsConnected = React.lazy(() => import('../components/debug/SocketsConnected'));
/** @/debug - Display amount of sockets logged-in: Only for development environment */
const SocketsLoggedIn = React.lazy(() => import('../components/debug/SocketsLoggedIn'));
/** @/debug - Initialize DB button: Only for development environment */
const Initialize = React.lazy(() => import('../components/debug/Initialize'));

const OffsetAppBar = styled('div')(({ theme }) => theme.mixins.toolbar);

export default function CommonLayout() {
  const theme = useTheme();
  const { user } = useAuth();
  const { room } = useRoom();
  const location = useLocation(); /** @/debug */

  const isLgViewport = useMediaQuery(theme.breakpoints.up('lg'));
  const communicationMethod = room?.setting.communicationMethod;

  return (
    <Box>
      {/** @todo: Fix mobile browser 100vh problem */}
      <Box height="100vh" display="flex" flexDirection="column" pb="0.5rem">
        {/* -------------- Header -------------- */}
        {user && (
          <>
            <AppBar
              component="header"
              sx={appBarStyle}
              // px={{ xs: '1.4rem', lg: '2%' }}
              // py="0.8rem"
              // borderBottom="2px solid"
              // borderColor="grey.300"
            >
              <Toolbar>
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
          height="100%"
          pt={{ xs: '1.4rem', lg: '2%' }}
          px={{ xs: '1.4rem', lg: '2%' }}
          sx={{ overflowY: 'auto' }}
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
              {communicationMethod === CommunicationMethodEnum.CHAT && <ChatLayout />}
              {communicationMethod === CommunicationMethodEnum.MIC && <VoiceCallLayout />}
            </Grid>
          )}
        </Grid>

        {/* -------------- Footer -------------- */}
        <Box component="footer" mt="0.5rem">
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
