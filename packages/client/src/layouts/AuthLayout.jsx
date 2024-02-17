import { Suspense } from "react";
import { useLoaderData, useOutlet, Await } from "react-router-dom";

import Loader from "../components/Loader";

import { SessionProvider } from "../hooks/useSession";
import { AuthProvider } from "../hooks/useAuth";
import { RoomProvider } from "../hooks/useRoom";

export default function AuthLayout() {
  const outlet = useOutlet();
  const { sessionPromise } = useLoaderData();
  const { userPromise } = useLoaderData();
  const { roomPromise } = useLoaderData();

  return (
    <Suspense fallback={<Loader />}>
      <Await
        resolve={async () => {
          const [session, user, room] = await Promise.all([
            sessionPromise,
            userPromise,
            roomPromise,
          ]);
          return { session, user, room };
        }}
        errorElement={<Loader />} /** @todo: implement error JSX */
        children={({ session, user, room }) => (
          <SessionProvider sessionData={session}>
            <AuthProvider userData={user}>
              <RoomProvider roomData={room}>{outlet}</RoomProvider>
            </AuthProvider>
          </SessionProvider>
        )}
      />
    </Suspense>
  );
}
