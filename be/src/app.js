const express = require('express');
const cors = require('cors');
const actionHistoryRoutes = require('./routes/actionHistoryRoutes');
const dataSensorRoutes = require('./routes/dataSensorRoutes');
const alertRoutes = require('./routes/alertRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route test
app.get('/', (req, res) => {
    res.json({ message: "IoT Backend Server is Running" });
});

app.use('/api/action-history', actionHistoryRoutes);
app.use('/api/data-sensors', dataSensorRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/dashboard', dashboardRoutes);

module.exports = app;