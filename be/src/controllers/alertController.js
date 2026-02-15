const Alert = require('../models/alertModel');
const alertService = require('../services/alertService');

class AlertController {
    // Notification Page: Get all alerts with pagination, search, filters
    static async getAll(req, res, next) {
        try {
            // Map frontend field names to database column names
            const orderByMap = {
                'timestamp': 'created_at',
                'created_at': 'created_at',
                'severity': 'severity'
            };
            
            const rawOrderBy = req.query.sortBy || req.query.orderBy || 'created_at';
            const orderBy = orderByMap[rawOrderBy] || 'created_at';
            
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                search: req.query.search || '',
                filterType: req.query.filterType || '',
                orderBy: orderBy,
                orderDirection: (req.query.sortOrder || req.query.orderDirection || 'desc').toUpperCase(),
            };

            const result = await Alert.getAll(options);
            
            res.json({
                success: true,
                message: 'Get all alerts successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    // Get statistics
    static async getStatistics(req, res, next) {
        try {
            const { days = 7 } = req.query;
            
            // Use service instead of direct model
            const stats = await alertService.getAlertStatistics(parseInt(days));

            res.json({
                success: true,
                message: 'Get alert statistics successfully',
                data: stats
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

    // Delete alert (mark as read)
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

    // Delete old alerts (Admin only)
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