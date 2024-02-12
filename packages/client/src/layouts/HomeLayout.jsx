import { useEffect } from "react";
import { useOutlet, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

import Initialize from "../debug/Initialize";

export default function HomeLayout() {
  const outlet = useOutlet();
  const navigate = useNavigate();

  const { user } = useAuth();

  // Check user log in status
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [navigate, user]);

  return (
    !user && (
      <div>
        <header>{/* Navigation */}</header>

        <main>
          {outlet} {/* Nested routes render here */}
        </main>

        <footer>Footer Content</footer>
        <Initialize />
      </div>
    )
  );
}
