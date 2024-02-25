import React from 'react';
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements
} from 'react-router-dom';

import { ProviderLayout, CommonLayout, ConnectLayout, DashboardLayout } from '@/layouts';
import { Home, Dashboard, CreateRoom, JoinRoom, Waiting, NotFound } from '@/pages';

function App() {
  const routes = createBrowserRouter(
    createRoutesFromElements(
      <Route element={<ConnectLayout />}>
        <Route element={<CommonLayout />}>
          <Route path="/" element={<Home />} />

          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create-room" element={<CreateRoom />} />
            <Route path="/join-room" element={<JoinRoom />} />
            <Route path="/waiting" element={<Waiting />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    )
  );

  return (
    <div className="App">
      <ProviderLayout>
        <RouterProvider router={routes} />
      </ProviderLayout>
    </div>
  );
}

export default App;
