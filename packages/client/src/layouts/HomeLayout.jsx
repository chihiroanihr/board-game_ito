import { Outlet } from "react-router-dom";

import Initialize from "../debug/Initialize";

export default function HomeLayout() {
  return (
    <div>
      {/* Header */}
      <header>{/* Navigation */}</header>

      {/* Main Section */}
      <main>
        <Outlet /> {/* Nested routes render here */}
      </main>

      {/* Footer */}
      <footer>Footer Content</footer>
      <Initialize />
    </div>
  );
}
