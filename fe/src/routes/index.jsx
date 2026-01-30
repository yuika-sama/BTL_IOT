import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import ActionHistory from "../pages/ActionHistory";
import Dashboard from "../pages/Dashboard";
import DataSensor from "../pages/DataSensor";
import Notification from "../pages/Notification";
import Profile from "../pages/Profile";
import NotFound from "../pages/NotFound";

export default function AppRoutes() {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/*" element={<NotFound />} />
            <Route path="/data-sensor" element={<DataSensor />} />
            <Route path="/notifications" element={<Notification />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/action-history" element={<ActionHistory />} />
        </Routes>
    </Router>
  );
}