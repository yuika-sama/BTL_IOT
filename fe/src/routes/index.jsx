import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import ActionHistory from "../pages/ActionHistory";
import Dashboard from "../pages/Dashboard";
import DataSensor from "../pages/DataSensor";
import Profile from "../pages/Profile";
import NotFound from "../pages/NotFound";

export default function AppRoutes() {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/data-sensor" element={<DataSensor />} />
            <Route path="/profile" element={<Profile />} />   
            <Route path="/action-history" element={<ActionHistory />} />
            
            {/* 404 */}
            <Route path="/*" element={<NotFound />} />
        </Routes>
    </Router>
  );
}