const Device = require('../models/deviceModel');
const deviceService = require('../services/deviceService');

class DeviceController {
    // Dashboard: Get all devices info
    static async getAllDevicesInfo(req, res, next) {
        try {
            const devices = await Device.getAllDevicesInfo();
            
            res.json({
                success: true,
                message: 'Get all devices info successfully',
                data: devices
            });
        } catch (error) {
            next(error);
        }
    }

    // Dashboard: Toggle device status (ON/OFF)
    static async toggleStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status, executor = 'user' } = req.body;

            if (status === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Status is required'
                });
            }

            // Use service instead of direct model
            const result = await deviceService.toggleDevice(id, status, executor);

            res.json({
                success: true,
                message: `Device turned ${status ? 'ON' : 'OFF'} successfully`,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    // Get all devices with pagination, search, filters (Admin only)
    static async getAll(req, res, next) {
        try {
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                search: req.query.search || '',
                orderBy: req.query.orderBy || 'created_at',
                orderDirection: req.query.orderDirection || 'DESC',
                filters: {
                    status: req.query.status !== undefined ? req.query.status === 'true' : undefined,
                    is_connected: req.query.is_connected !== undefined ? req.query.is_connected === 'true' : undefined,
                    type: req.query.type || undefined
                }
            };

            const result = await Device.getAll(options);
            
            res.json({
                success: true,
                message: 'Get all devices successfully',
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    // Get device by ID (Admin only)
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const device = await Device.getById(id);

            if (!device) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found'
                });
            }

            res.json({
                success: true,
                message: 'Get device successfully',
                data: device
            });
        } catch (error) {
            next(error);
        }
    }

    // Create new device (Admin only)
    static async create(req, res, next) {
        try {
            const { name, type, status } = req.body;

            if (!name || !type) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and type are required'
                });
            }

            const device = await Device.create(name, type, status || false);

            res.status(201).json({
                success: true,
                message: 'Device created successfully',
                data: device
            });
        } catch (error) {
            next(error);
        }
    }

    // Update device (Admin only)
    static async update(req, res, next) {
        try {
            const { id } = req.params;
            const deviceData = req.body;

            const device = await Device.update(id, deviceData);

            res.json({
                success: true,
                message: 'Device updated successfully',
                data: device
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete device (Admin only)
    static async delete(req, res, next) {
        try {
            const { id } = req.params;
            const deleted = await Device.delete(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found'
                });
            }

            res.json({
                success: true,
                message: 'Device deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = DeviceController;