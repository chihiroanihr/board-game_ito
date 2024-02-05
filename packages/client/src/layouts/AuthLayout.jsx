import { Suspense } from "react";
import { useLoaderData, useOutlet, Await } from "react-router-dom";

import { AuthProvider } from "../hooks/useAuth";
import { RoomProvider } from "../hooks/useRoom";

export default function AuthLayout() {
  const outlet = useOutlet();
  const { userPromise } = useLoaderData();
  const { roomPromise } = useLoaderData();

  return (
    <Suspense fallback={"Loading"} /** @todo: loader JSX */>
      <Await
        resolve={async () => {
          const [user, room] = await Promise.all([userPromise, roomPromise]);
          return { user, room };
        }}
        errorElement={"Something went wrong."} /** @todo: implement error JSX */
        children={({ user, room }) => (
          <AuthProvider userData={user}>
            <RoomProvider roomData={room}>{outlet}</RoomProvider>
          </AuthProvider>
        )}
      />
    </Suspense>
  );
}
