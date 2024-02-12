// Import React Router
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  defer,
} from "react-router-dom";

// Import all the pages to be used for routing
import AuthLayout from "./layouts/AuthLayout";
import ConnectLayout from "./layouts/ConnectLayout";
import HomeLayout from "./layouts/HomeLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import Home from "./pages/Home";
import CreateRoom from "./pages/CreateRoom";
import JoinRoom from "./pages/JoinRoom";
import Waiting from "./pages/Waiting";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";

// Ideally this would be an API call to server to get logged in user data
const getLocalSessionData = () =>
  new Promise((resolve) =>
    setTimeout(() => {
      const user = window.localStorage.getItem("session");
      resolve(user);
    }, 3000)
  );

const getLocalUserData = () =>
  new Promise((resolve) =>
    setTimeout(() => {
      const user = window.localStorage.getItem("user");
      resolve(user);
    }, 3000)
  );

const getLocalRoomData = () =>
  new Promise((resolve) =>
    setTimeout(() => {
      const room = window.localStorage.getItem("room");
      resolve(room);
    }, 3000)
  );

// Declare a routing table
const routes = createBrowserRouter(
  createRoutesFromElements(
    // Layout Route
    <Route
      element={<AuthLayout />}
      loader={
        () =>
          defer({
            sessionPromise: getLocalSessionData(),
            userPromise: getLocalUserData(),
            roomPromise: getLocalRoomData(),
          }) // defer() allows us to pass promises instead of resolved values before the Route component is rendered.
      }
    >
      <Route element={<ConnectLayout />}>
        <Route element={<HomeLayout />}>
          <Route path="/" element={<Home />} />
        </Route>

        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-room" element={<CreateRoom />} />
          <Route path="/join-room" element={<JoinRoom />} />
          <Route path="/waiting" element={<Waiting />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

export default routes;
