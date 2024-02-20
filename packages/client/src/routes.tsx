import React from "react";

// Import React Router
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";

// Import all the pages to be used for routing
import CommonLayout from "./layouts/CommonLayout";
import ConnectLayout from "./layouts/ConnectLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import Home from "./pages/Home";
import CreateRoom from "./pages/CreateRoom";
import JoinRoom from "./pages/JoinRoom";
import Waiting from "./pages/Waiting";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";

const routes = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<ConnectLayout />}>
      <Route element={<CommonLayout />}>
        <Route path="/" element={<Home />} />

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
