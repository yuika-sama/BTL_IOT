const ActionHistory = require('../models/actionHistoryModel');
const ApiResponse = require('../utils/response');
const Logger = require('../utils/logger');

class ActionHistoryController {
    // Action History Page: Get all action history with pagination, search, filters
    static async getAll(req, res, next) {
        try {
            // Map frontend sortBy to database column names
            const sortByMap = {
                'timestamp': 'created_at',
                'device_name': 'device_name',
                'value': 'command',
                'status': 'status',
                'executor': 'executor'
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

            const result = await ActionHistory.getAll(options);
            return ApiResponse.success(res, result, 'Get all action history successfully');
        } catch (error) {
            Logger.error('Error in getAll:', error);
            next(error);
        }
    }

    // Get action history by ID
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const action = await ActionHistory.getById(id);

            if (!action) {
                return ApiResponse.notFound(res, 'Action history not found');
            }

            return ApiResponse.success(res, action, 'Get action history successfully');
        } catch (error) {
            Logger.error('Error in getById:', error);
            next(error);
        }
    }

    // Get statistics
    static async getStatistics(req, res, next) {
        try {
            const stats = await ActionHistory.getStatistics();
            return ApiResponse.success(res, stats, 'Get action history statistics successfully');
        } catch (error) {
            Logger.error('Error in getStatistics:', error);
            next(error);
        }
    }
}

module.exports = ActionHistoryController;