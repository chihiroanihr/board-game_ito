import React from 'react';
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom';
import { Container } from '@mui/material';

import { SessionProvider, AuthProvider, RoomProvider, SocketProvider } from '@/hooks';
import { CommonLayout, ConnectLayout } from '@/layouts';
import { Home, Dashboard, CreateRoom, JoinRoom, Waiting, NotFound } from '@/pages';
import { socket } from './service/socket';

function App() {
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
    <Container>
      <SessionProvider>
        <AuthProvider>
          <RoomProvider>
            <SocketProvider socket={socket}>
              <RouterProvider router={routes} />
            </SocketProvider>
          </RoomProvider>
        </AuthProvider>
      </SessionProvider>
    </Container>
  );
}

export default App;
