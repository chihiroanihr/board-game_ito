import React, { useEffect, useMemo } from 'react';
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom';
import { useTheme, useMediaQuery } from '@mui/material';

import {
  SessionProvider,
  AuthProvider,
  RoomProvider,
  GameProvider,
  SocketProvider,
  SubmissionStatusProvider,
  RemoteStreamsProvider,
  useWindowDimensions,
} from '@/hooks';
import { CommonLayout, ConnectLayout, GameLayout } from '@/layouts';
import { Home, Dashboard, CreateRoom, JoinRoom, Waiting, Game, NotFound } from '@/pages';
import { socket } from '@/services';

// Function to calculate window (screen) height and set the CSS variable
const setWindowHeightCSS = (height: number = window.innerHeight) => {
  document.documentElement.style.setProperty('--window-height', `${height}px`);
};

function App() {
  const { width, height } = useWindowDimensions();
  const theme = useTheme();
  const isLgViewport = useMediaQuery(theme.breakpoints.up('lg'));

  useEffect(() => {
    // Calculate window height only when window width is less than large viewport (a.k.a on mobile screen)
    if (!isLgViewport) {
      setWindowHeightCSS(height);
    }
  }, [height, isLgViewport]);

  const routes = useMemo(
    () =>
      createBrowserRouter(
        createRoutesFromElements(
          <Route element={<ConnectLayout />}>
            <Route element={<CommonLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create-room" element={<CreateRoom />} />
              <Route path="/join-room" element={<JoinRoom />} />
              <Route element={<GameLayout />}>
                <Route path="/waiting" element={<Waiting />} />
                <Route path="/game" element={<Game />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        )
      ),
    []
  );

  return (
    <SessionProvider>
      <AuthProvider>
        <RoomProvider>
          <GameProvider>
            <SocketProvider socket={socket}>
              <SubmissionStatusProvider>
                <RemoteStreamsProvider>
                  <RouterProvider router={routes} />
                </RemoteStreamsProvider>
              </SubmissionStatusProvider>
            </SocketProvider>
          </GameProvider>
        </RoomProvider>
      </AuthProvider>
    </SessionProvider>
  );
}

export default App;
