// Import React Router
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  defer,
} from "react-router-dom";

// Import all the pages to be used for routing
import AuthLayout from "./layouts/AuthLayout";
import SocketLayout from "./layouts/SocketLayout";
import HomeLayout from "./layouts/HomeLayout";
import ProtectedLayout from "./layouts/ProtectedLayout";
import Home from "./pages/Home";
import CreateRoom from "./pages/CreateRoom";
import JoinRoom from "./pages/JoinRoom";
import Waiting from "./pages/Waiting";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";

// Ideally this would be an API call to server to get logged in user data
const getUserData = () =>
  new Promise((resolve) =>
    setTimeout(() => {
      const user = window.localStorage.getItem("user");
      resolve(user);
    }, 3000)
  );

// Declare a routing table
const routes = createBrowserRouter(
  createRoutesFromElements(
    // Layout Route
    <Route
      element={<AuthLayout />}
      loader={() => defer({ userPromise: getUserData() })} // defer() allows us to pass promises instead of resolved values before the Route component is rendered.
    >
      <Route element={<SocketLayout />}>
        <Route element={<HomeLayout />}>
          <Route path="/" element={<Home />} />
        </Route>

        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-room" element={<CreateRoom />} />
          <Route path="/join-room" element={<JoinRoom />} />
          <Route path="/waiting/:roomId" element={<Waiting />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

export default routes;
