const Alert = require('../models/alertModel');
const alertService = require('../services/alertService');
const ApiResponse = require('../utils/response');
const Logger = require('../utils/logger');

class AlertController {
    // Notification Page: Get all alerts with pagination, search, filters
    static async getAll(req, res, next) {
        try {
            // Map frontend sortBy to database column names
            const sortByMap = {
                'timestamp': 'created_at',
                'severity': 'severity',
                'status': 'status'
            };
            
            const sortBy = req.query.sortBy || 'timestamp';
            const orderBy = sortByMap[sortBy] || 'created_at';
            
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                search: req.query.search || '',
                filterType: req.query.filterType || '',
                orderBy: orderBy,
                orderDirection: (req.query.sortOrder || 'desc').toUpperCase(),
            };

            const result = await Alert.getAll(options);
            return ApiResponse.success(res, result, 'Get all alerts successfully');
        } catch (error) {
            Logger.error('Error in getAll:', error);
            next(error);
        }
    }

    // Get statistics
    static async getStatistics(req, res, next) {
        try {
            const { days = 7 } = req.query;
            const stats = await alertService.getAlertStatistics(parseInt(days));
            return ApiResponse.success(res, stats, 'Get alert statistics successfully');
        } catch (error) {
            Logger.error('Error in getStatistics:', error);
            next(error);
        }
    }

    // Get alert by ID
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const alert = await Alert.getById(id);

            if (!alert) {
                return ApiResponse.notFound(res, 'Alert not found');
            }

            return ApiResponse.success(res, alert, 'Get alert successfully');
        } catch (error) {
            Logger.error('Error in getById:', error);
            next(error);
        }
    }

    // Delete alert (mark as read)
    static async delete(req, res, next) {
        try {
            const { id } = req.params;
            const deleted = await Alert.delete(id);

            if (!deleted) {
                return ApiResponse.notFound(res, 'Alert not found');
            }

            return ApiResponse.success(res, null, 'Alert deleted successfully');
        } catch (error) {
            Logger.error('Error in delete:', error);
            next(error);
        }
    }
}

module.exports = AlertController;