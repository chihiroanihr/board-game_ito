import { useEffect } from "react";
import { useNavigate, useOutlet } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import Initialize from "../debug/Initialize";

export default function HomeLayout() {
  const navigate = useNavigate();
  const outlet = useOutlet();
  const { user, logout } = useAuth();

  // Check local storage change
  useEffect(() => {
    const checkLocalStorage = () => {
      const storedUser = window.localStorage.getItem("user");
      if (!storedUser || !user) {
        logout();
      }
    };

    window.addEventListener("storage", checkLocalStorage);
    return () => window.removeEventListener("storage", checkLocalStorage);
  }, [user, navigate, logout]);

  // If user already logged-in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    !user && (
      <div>
        {/* Header */}
        <header>{/* Navigation */}</header>

        {/* Main Section */}
        <main>
          {outlet} {/* Nested routes render here */}
        </main>

        {/* Footer */}
        <footer>Footer Content</footer>
        <Initialize />
      </div>
    )
  );
}
