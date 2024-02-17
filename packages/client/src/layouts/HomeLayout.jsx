import { useOutlet } from "react-router-dom";

import LazyComponentWrapper from "../components/LazyComponentWrapper";

import { useAuth } from "../hooks/useAuth";

/** @debug - Initialize DB button: Only for development environment */
const initializeComponent = () =>
  import("../components/debug/Initialize").then((module) => module.default);

/**
 * Layout page for Home
 * @returns
 */
export default function HomeLayout() {
  const outlet = useOutlet();

  const { user } = useAuth();

  if (user) return null;
  return (
    <>
      {outlet} {/* Nested routes render here */}
      {process.env.NODE_ENV !== "production" && (
        <LazyComponentWrapper loadComponent={initializeComponent} />
      )}
    </>
  );
}
