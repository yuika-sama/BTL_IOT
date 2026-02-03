const Alert = require('../models/alertModel');

class AlertController {
    // Notification Page: Get all alerts with pagination, search, filters
    static async getAll(req, res, next) {
        try {
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                search: req.query.search || '',
                orderBy: req.query.orderBy || 'created_at',
                orderDirection: req.query.orderDirection || 'DESC',
                filters: {
                    severity: req.query.severity || undefined,
                    device_id: req.query.device_id || undefined,
                    sensor_id: req.query.sensor_id || undefined,
                    startDate: req.query.startDate || undefined,
                    endDate: req.query.endDate || undefined
                }
            };

            const result = await Alert.getAll(options);
            
            res.json({
                success: true,
                message: 'Get all alerts successfully',
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    // Get alert by ID
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const alert = await Alert.getById(id);

            if (!alert) {
                return res.status(404).json({
                    success: false,
                    message: 'Alert not found'
                });
            }

            res.json({
                success: true,
                message: 'Get alert successfully',
                data: alert
            });
        } catch (error) {
            next(error);
        }
    }

    // Get alerts by device ID
    static async getByDeviceId(req, res, next) {
        try {
            const { deviceId } = req.params;
            const { limit = 50 } = req.query;
            
            const alerts = await Alert.getByDeviceId(deviceId, parseInt(limit));

            res.json({
                success: true,
                message: 'Get alerts by device successfully',
                data: alerts
            });
        } catch (error) {
            next(error);
        }
    }

    // Get alerts by sensor ID
    static async getBySensorId(req, res, next) {
        try {
            const { sensorId } = req.params;
            const { limit = 50 } = req.query;
            
            const alerts = await Alert.getBySensorId(sensorId, parseInt(limit));

            res.json({
                success: true,
                message: 'Get alerts by sensor successfully',
                data: alerts
            });
        } catch (error) {
            next(error);
        }
    }

    // Get alerts by severity
    static async getBySeverity(req, res, next) {
        try {
            const { severity } = req.params;
            const { limit = 50 } = req.query;
            
            const alerts = await Alert.getBySeverity(severity, parseInt(limit));

            res.json({
                success: true,
                message: 'Get alerts by severity successfully',
                data: alerts
            });
        } catch (error) {
            next(error);
        }
    }

    // Get alerts by date range
    static async getByDateRange(req, res, next) {
        try {
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Start date and end date are required'
                });
            }

            const alerts = await Alert.getByDateRange(startDate, endDate);

            res.json({
                success: true,
                message: 'Get alerts by date range successfully',
                data: alerts
            });
        } catch (error) {
            next(error);
        }
    }

    // Get statistics
    static async getStatistics(req, res, next) {
        try {
            const stats = await Alert.getStatistics();

            res.json({
                success: true,
                message: 'Get alert statistics successfully',
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    // Create new alert (usually from MQTT when threshold exceeded)
    static async create(req, res, next) {
        try {
            const { sensor_id, device_id, title, description, severity } = req.body;

            if (!sensor_id || !device_id || !title || !description || !severity) {
                return res.status(400).json({
                    success: false,
                    message: 'Sensor ID, device ID, title, description, and severity are required'
                });
            }

            const alert = await Alert.create({
                sensor_id,
                device_id,
                title,
                description,
                severity
            });

            res.status(201).json({
                success: true,
                message: 'Alert created successfully',
                data: alert
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete alert
    static async delete(req, res, next) {
        try {
            const { id } = req.params;
            const deleted = await Alert.delete(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Alert not found'
                });
            }

            res.json({
                success: true,
                message: 'Alert deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete old alerts
    static async deleteOldAlerts(req, res, next) {
        try {
            const { days = 30 } = req.query;
            const deletedCount = await Alert.deleteOldAlerts(parseInt(days));

            res.json({
                success: true,
                message: `Deleted ${deletedCount} old alert records`,
                deletedCount: deletedCount
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AlertController;