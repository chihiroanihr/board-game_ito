import React, { useEffect } from 'react';
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
  SocketProvider,
  SubmissionStatusProvider,
  useWindowDimensions,
} from '@/hooks';
import { CommonLayout, ConnectLayout } from '@/layouts';
import { Home, Dashboard, CreateRoom, JoinRoom, Waiting, NotFound } from '@/pages';
import { socket } from './service/socket';

function App() {
  const { width, height } = useWindowDimensions();
  const theme = useTheme();
  const isLgViewport = useMediaQuery(theme.breakpoints.up('lg'));

  useEffect(() => {
    // Function to calculate window (screen) height and set the CSS variable
    const setWindowHeightCSS = () => {
      const doc = document.documentElement;
      doc.style.setProperty('--window-height', `${height}px`);
    };

    // Calculate window height only when window width is less than large viewport (a.k.a on mobile screen)
    if (!isLgViewport) {
      setWindowHeightCSS();
    }
  }, [height, isLgViewport, width]); // * width as dependency is important since it is a value for resize event listener

  const routes = createBrowserRouter(
    createRoutesFromElements(
      <Route element={<ConnectLayout />}>
        <Route element={<CommonLayout />}>
          <Route path="/" element={<Home />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-room" element={<CreateRoom />} />
          <Route path="/join-room" element={<JoinRoom />} />
          <Route path="/waiting" element={<Waiting />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    )
  );

  return (
    <SessionProvider>
      <AuthProvider>
        <RoomProvider>
          <SocketProvider socket={socket}>
            <SubmissionStatusProvider>
              <RouterProvider router={routes} />
            </SubmissionStatusProvider>
          </SocketProvider>
        </RoomProvider>
      </AuthProvider>
    </SessionProvider>
  );
}

export default App;
