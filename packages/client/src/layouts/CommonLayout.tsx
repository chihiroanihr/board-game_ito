import React from 'react';
import { useOutlet, useLocation } from 'react-router-dom';

import LazyComponentWrapper from '../components/LazyComponentWrapper';

/** @debug - Display amount of sockets connected: Only for development environment */
const socketsConnectedComponent = () =>
  import('../components/debug/SocketsConnected').then((module) => ({ default: module.default }));

/** @debug - Display amount of sockets logged-in: Only for development environment */
const socketsLoggedInComponent = () =>
  import('../components/debug/SocketsLoggedIn').then((module) => ({ default: module.default }));

/** @debug - Initialize DB button: Only for development environment */
const initializeComponent = () =>
  import('../components/debug/Initialize').then((module) => ({ default: module.default }));

// OR
// const initializeComponent = async (): Promise<{ default: React.ComponentType<{}> }> => {
//   const module = await import('../components/debug/Initialize');
//   return {
//     default: module.default
//   };
// };

// OR
// const initializeComponent = (() => {
//   return () =>
//     import('../components/debug/Initialize').then((module) => ({ default: module.default }));
// })();

export default function CommonLayout() {
  const location = useLocation(); /** @debug */
  const outlet = useOutlet();

  return (
    <>
      <header>{/* Navigation */}</header>

      <main>
        {outlet}

        {process.env.NODE_ENV !== 'production' && (
          <>
            <hr />
            {location.pathname === '/' && (
              <LazyComponentWrapper loadComponent={initializeComponent} />
            )}
            <LazyComponentWrapper loadComponent={socketsConnectedComponent} />
            <LazyComponentWrapper loadComponent={socketsLoggedInComponent} />
            <hr />
          </>
        )}
      </main>

      <footer>Footer Content</footer>
    </>
  );
}
