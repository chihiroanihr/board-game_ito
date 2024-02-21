import React, { Suspense, useState, useEffect } from 'react';

import Loader from './Loader';

// Define the props type (Every components passed must be "default" exports.)
interface LazyComponentWrapperProps {
  loadComponent: () => Promise<{ default: React.ComponentType<{}> }>;
}

// LazyComponentWrapper accepts a function prop `loadComponent`
const LazyComponentWrapper: React.FC<LazyComponentWrapperProps> = ({ loadComponent }) => {
  const [Component, setComponent] = useState<React.ComponentType<{}> | null>(() => Loader);

  useEffect(() => {
    loadComponent().then((component) => {
      setComponent(component.default);
    });
  }, [loadComponent]);

  // Use React.Suspense to handle the loading state
  return <Suspense fallback={<Loader />}>{Component && <Component />}</Suspense>;
};

export default LazyComponentWrapper;
