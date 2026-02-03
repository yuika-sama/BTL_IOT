const Device = require('../models/deviceModel');
const ActionHistory = require('../models/actionHistoryModel');
const mqttService = require('../services/mqttService');
const websocketService = require('../services/websocketService');

class DeviceController {
    // Get all devices with pagination, search, filters
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

    // Get device by ID
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

    // Get device with sensors
    static async getWithSensors(req, res, next) {
        try {
            const { id } = req.params;
            const device = await Device.getWithSensors(id);

            if (!device) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found'
                });
            }

            res.json({
                success: true,
                message: 'Get device with sensors successfully',
                data: device
            });
        } catch (error) {
            next(error);
        }
    }

    // Create new device
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

    // Update device
    static async update(req, res, next) {
        try {
            const { id } = req.params;
            const deviceData = req.body;

            const device = await Device.update(id, deviceData);

            if (!device) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found'
                });
            }

            res.json({
                success: true,
                message: 'Device updated successfully',
                data: device
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete device
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

    // Dashboard: Toggle device status (ON/OFF)
    static async toggleStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status, executor = 'system' } = req.body;

            if (status === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Status is required'
                });
            }

            // Update device status in database
            const device = await Device.updateStatus(id, status);

            if (!device) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found'
                });
            }

            // Save to action history
            const actionHistory = await ActionHistory.create({
                device_id: id,
                command: status ? 'ON' : 'OFF',
                executor: executor,
                status: 'success'
            });

            // Publish to MQTT
            mqttService.publish(process.env.MQTT_TOPIC_DEVICE, {
                device_id: id,
                command: status ? 'ON' : 'OFF',
                timestamp: new Date()
            });

            // Broadcast to WebSocket clients
            websocketService.broadcast('device_status_changed', {
                device_id: id,
                device_name: device.name,
                status: status,
                timestamp: new Date()
            });

            res.json({
                success: true,
                message: `Device turned ${status ? 'ON' : 'OFF'} successfully`,
                data: {
                    device,
                    action: actionHistory
                }
            });
        } catch (error) {
            // Save failed action to history
            try {
                await ActionHistory.create({
                    device_id: req.params.id,
                    command: req.body.status ? 'ON' : 'OFF',
                    executor: req.body.executor || 'system',
                    status: 'failed'
                });
            } catch (historyError) {
                console.error('Error saving action history:', historyError);
            }
            next(error);
        }
    }

    // Update connection status
    static async updateConnection(req, res, next) {
        try {
            const { id } = req.params;
            const { is_connected } = req.body;

            if (is_connected === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Connection status is required'
                });
            }

            const device = await Device.updateConnection(id, is_connected);

            if (!device) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found'
                });
            }

            // Broadcast to WebSocket clients
            websocketService.broadcast('device_connection_changed', {
                device_id: id,
                is_connected: is_connected,
                timestamp: new Date()
            });

            res.json({
                success: true,
                message: 'Device connection status updated successfully',
                data: device
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = DeviceController;