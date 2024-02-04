import { Suspense } from "react";
import { useLoaderData, useOutlet, Await } from "react-router-dom";

import { AuthProvider } from "../hooks/useAuth";

export default function AuthLayout() {
  const outlet = useOutlet();
  const { userPromise } = useLoaderData();

  return (
    <Suspense fallback={"Loading"} /** @todo: loader JSX */>
      <Await
        resolve={userPromise}
        errorElement={"Something went wrong."} /** @todo: implement error JSX */
        children={(user) => (
          <AuthProvider userData={user}>{outlet}</AuthProvider>
        )}
      />
    </Suspense>
  );
}
