import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import ActionHistory from "../pages/ActionHistory";
import Dashboard from "../pages/Dashboard";
import DataSensor from "../pages/DataSensor";
import Notification from "../pages/Notification";
import Profile from "../pages/Profile";
import NotFound from "../pages/NotFound";
import Automation from "../pages/Automation";
import AdminDevice from "../pages/AdminDevice";
import AdminSensor from "../pages/AdminSensor";

export default function AppRoutes() {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/data-sensor" element={<DataSensor />} />
            <Route path="/automation" element={<Automation />} />
            <Route path="/notifications" element={<Notification />} />
            <Route path="/profile" element={<Profile />} />   
            <Route path="/action-history" element={<ActionHistory />} />
            
            {/* Admin Routes - Hidden */}
            <Route path="/admin/devices" element={<AdminDevice />} />
            <Route path="/admin/sensors" element={<AdminSensor />} />
            
            {/* 404 - Must be last */}
            <Route path="/*" element={<NotFound />} />
        </Routes>
    </Router>
  );
}