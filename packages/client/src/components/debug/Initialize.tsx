import React, { useState } from 'react';

import type { InitializeResponse } from '@bgi/shared';

import { useSocket } from '@/hooks';
import { outputServerError, outputResponseTimeoutError } from '@/utils';

export default function Initialize() {
  const { socket } = useSocket();

  const [loading, setLoading] = useState<boolean>(false);

  const initializeHandler = async () => {
    setLoading(true);

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      setLoading(false);
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit(
      'initialize',
      async ({ error, roomsDeleted, usersDeleted, sessionsDeleted }: InitializeResponse) => {
        // Clear the timeout as response is received before timeout
        clearTimeout(timeoutId);

        if (error) {
          outputServerError(error);
        } else {
          if (roomsDeleted || usersDeleted || sessionsDeleted) {
            alert('[Success]: Successfully initialized Mongo DB.');
          } else {
            alert('[Error]: Could not initialize database (Database could be already empty).');
          }
        }

        setLoading(false); // Set loading to false when the response is received
      }
    );
  };

  return (
    <button onClick={initializeHandler} disabled={loading}>
      {loading ? 'Loading...' : 'Initialize Data'}
    </button>
  );
}
