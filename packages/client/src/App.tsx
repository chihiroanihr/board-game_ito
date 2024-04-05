import React from 'react';
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom';

import {
  SessionProvider,
  AuthProvider,
  RoomProvider,
  SocketProvider,
  SubmissionStatusProvider,
} from '@/hooks';
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
