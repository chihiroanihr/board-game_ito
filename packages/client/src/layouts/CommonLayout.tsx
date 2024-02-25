import React, { Suspense } from 'react';
import { useOutlet, useLocation } from 'react-router-dom';

import { Loader } from '@/components';

/** @/debug - Display amount of sockets connected: Only for development environment */
const SocketsConnected = React.lazy(() => import('../components/debug/SocketsConnected'));
/** @/debug - Display amount of sockets logged-in: Only for development environment */
const SocketsLoggedIn = React.lazy(() => import('../components/debug/SocketsLoggedIn'));
/** @/debug - Initialize DB button: Only for development environment */
const Initialize = React.lazy(() => import('../components/debug/Initialize'));

export default function CommonLayout() {
  const location = useLocation(); /** @/debug */
  const outlet = useOutlet();

  return (
    <>
      <header>{/* Navigation */}</header>

      <main>
        {outlet}

        {process.env.NODE_ENV !== 'production' && (
          <Suspense fallback={<Loader />}>
            <hr />
            {location.pathname === '/' && <Initialize />}
            <SocketsConnected />
            <SocketsLoggedIn />
            <hr />
          </Suspense>
        )}
      </main>

      <footer>Footer Content</footer>
    </>
  );
}
