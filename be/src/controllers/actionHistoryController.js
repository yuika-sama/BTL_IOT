const ActionHistory = require('../models/actionHistoryModel');
const formatTime = require('../utils/formatter').formatTime;
class ActionHistoryController {
    // Action History Page: Get all action history with pagination, search, filters
    static async getAll(req, res, next) {
        try {
            // Map frontend field names to database column names
            const orderByMap = {
                'timestamp': 'created_at',
                'created_at': 'created_at'
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

            const result = await ActionHistory.getAll(options);
            
            res.json({
                success: true,
                message: 'Get all action history successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    // Get action history by ID
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const action = await ActionHistory.getById(id);

            if (!action) {
                return res.status(404).json({
                    success: false,
                    message: 'Action history not found'
                });
            }

            res.json({
                success: true,
                message: 'Get action history successfully',
                data: action
            });
        } catch (error) {
            next(error);
        }
    }

    // Get action history by device ID
    static async getByDeviceId(req, res, next) {
        try {
            const { deviceId } = req.params;
            const { limit = 50 } = req.query;
            
            const actions = await ActionHistory.getByDeviceId(deviceId, parseInt(limit));

            res.json({
                success: true,
                message: 'Get action history by device successfully',
                data: actions
            });
        } catch (error) {
            next(error);
        }
    }

    // Get action history by executor
    static async getByExecutor(req, res, next) {
        try {
            const { executor } = req.params;
            const { limit = 50 } = req.query;
            
            const actions = await ActionHistory.getByExecutor(executor, parseInt(limit));

            res.json({
                success: true,
                message: 'Get action history by executor successfully',
                data: actions
            });
        } catch (error) {
            next(error);
        }
    }

    // Get action history by status
    static async getByStatus(req, res, next) {
        try {
            const { status } = req.params;
            const { limit = 50 } = req.query;
            
            const actions = await ActionHistory.getByStatus(status, parseInt(limit));

            res.json({
                success: true,
                message: 'Get action history by status successfully',
                data: actions
            });
        } catch (error) {
            next(error);
        }
    }

    // Get action history by date range
    static async getByDateRange(req, res, next) {
        try {
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Start date and end date are required'
                });
            }

            const actions = await ActionHistory.getByDateRange(startDate, endDate);

            res.json({
                success: true,
                message: 'Get action history by date range successfully',
                data: actions
            });
        } catch (error) {
            next(error);
        }
    }

    // Get statistics
    static async getStatistics(req, res, next) {
        try {
            const stats = await ActionHistory.getStatistics();

            res.json({
                success: true,
                message: 'Get action history statistics successfully',
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    // Create action history (usually automatic)
    static async create(req, res, next) {
        try {
            const { device_id, command, executor, status } = req.body;

            if (!device_id || !command || !executor || !status) {
                return res.status(400).json({
                    success: false,
                    message: 'Device ID, command, executor, and status are required'
                });
            }

            const action = await ActionHistory.create({
                device_id,
                command,
                executor,
                status
            });

            res.status(201).json({
                success: true,
                message: 'Action history created successfully',
                data: action
            });
        } catch (error) {
            next(error);
        }
    }

    // Update action status
    static async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status) {
                return res.status(400).json({
                    success: false,
                    message: 'Status is required'
                });
            }

            const action = await ActionHistory.updateStatus(id, status);

            if (!action) {
                return res.status(404).json({
                    success: false,
                    message: 'Action history not found'
                });
            }

            res.json({
                success: true,
                message: 'Action status updated successfully',
                data: action
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete action history
    static async delete(req, res, next) {
        try {
            const { id } = req.params;
            const deleted = await ActionHistory.delete(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Action history not found'
                });
            }

            res.json({
                success: true,
                message: 'Action history deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete old actions
    static async deleteOldActions(req, res, next) {
        try {
            const { days = 90 } = req.query;
            const deletedCount = await ActionHistory.deleteOldActions(parseInt(days));

            res.json({
                success: true,
                message: `Deleted ${deletedCount} old action history records`,
                deletedCount: deletedCount
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ActionHistoryController;