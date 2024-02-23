import React, { ReactNode } from 'react';

// Import all providers (hooks)
import { SessionProvider, AuthProvider, RoomProvider, SocketProvider } from '@/hook';
import { socket } from '../service/socket';

interface ProviderLayoutProps {
  children: ReactNode; // This tells TypeScript that children are allowed as props
}

// ProviderLayout component containing all the providers
const ProviderLayout: React.FC<ProviderLayoutProps> = ({ children }) => (
  <SessionProvider>
    <AuthProvider>
      <RoomProvider>
        <SocketProvider socket={socket}>
          {children} {/* Render the children components */}
        </SocketProvider>
      </RoomProvider>
    </AuthProvider>
  </SessionProvider>
);

export default ProviderLayout;
