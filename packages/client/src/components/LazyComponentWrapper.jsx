import { Suspense, useState, useEffect } from "react";

import Loader from "./Loader";

// LazyComponentWrapper accepts a function prop `loadComponent`
const LazyComponentWrapper = ({ loadComponent }) => {
  const [Component, setComponent] = useState(() => Loader);

  useEffect(() => {
    loadComponent().then((component) => {
      setComponent(() => component);
    });
  }, [loadComponent]);

  // Use React.Suspense to handle the loading state
  return (
    <Suspense fallback={<Loader />}>
      <Component />
    </Suspense>
  );
};

export default LazyComponentWrapper;
