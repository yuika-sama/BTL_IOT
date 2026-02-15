const Device = require('../models/deviceModel');
const ActionHistory = require('../models/actionHistoryModel');
const deviceService = require('../services/deviceService');
const socketService = require('../services/socketService');
const mqttService = require('../services/mqttService');

class DeviceController {
    // Dashboard: Get all devices info (only connected devices)
    static async getAllDevicesInfo(req, res, next) {
        try {
            const devices = await Device.getAllDevicesInfo(true); // Only connected devices
            
            res.json({
                success: true,
                message: 'Get all devices info successfully',
                data: devices
            });
        } catch (error) {
            next(error);
        }
    }

    // Dashboard: Toggle device status (ON/OFF) - MANUAL MODE
    static async toggleStatus(req, res, next) {
        let actionHistory = null;
        
        try {
            const { id } = req.params;
            
            const device = await Device.getById(id);
            if (!device) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found'
                });
            }

            // Check if device is connected
            if (!device.is_connected) {
                return res.status(503).json({
                    success: false,
                    message: 'Device is not connected'
                });
            }

            // Toggle value: 1 (ON) <-> 0 (OFF)
            const newValue = device.value === 1 ? 0 : 1;
            const previousValue = device.value;
            
            // Create action history with 'waiting' status
            actionHistory = await ActionHistory.create({
                device_id: id,
                command: newValue === 1 ? 'ON' : 'OFF',
                executor: 'user',
                status: 'waiting'
            });
            
            // Set status to WAITING
            await Device.updateWithCommandStatus(id, { 
                status: 'waiting'
            });
            
            // Broadcast WAITING state to frontend
            socketService.broadcastDeviceStatus({
                device_id: id,
                status: 'waiting',
                value: previousValue,
                timestamp: new Date()
            });

            // QUAN TRỌNG: Khi toggle thủ công, tắt auto_toggle
            await Device.update(id, { auto_toggle: 0 });

            // Gửi lệnh điều khiển xuống ESP32 qua MQTT với tracking
            // Map device ID to LED key using ENV variables
            const ledMapping = {
                [process.env.DEVICE_TEMPERATURE_ID]: 'led_temp',
                [process.env.DEVICE_HUMIDITY_ID]: 'led_hum',
                [process.env.DEVICE_LIGHT_ID]: 'led_ldr',
                [process.env.DEVICE_DUST_ID]: 'led_dust'
            };

            const ledKey = ledMapping[id];
            if (!ledKey) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid device type or device not configured in environment'
                });
            }

            try {
                // Send command with tracking (will wait for confirmation from ESP32)
                await mqttService.publishCommandWithTracking(
                    'abcde1', 
                    ledKey, 
                    newValue, 
                    id,
                    10000, // 10 second timeout
                    actionHistory.id // Pass action_history_id for tracking
                );

                // Response sent immediately after command is published
                // Actual status update will come via MQTT confirmation
                res.json({
                    success: true,
                    message: `Device command sent, waiting for confirmation...`,
                    data: {
                        id: id,
                        status: 'waiting',
                        value: previousValue,
                        target_value: newValue
                    }
                });

            } catch (error) {
                console.error('❌ Failed to send command:', error);
                
                // Update action history to failed
                if (actionHistory && actionHistory.id) {
                    await ActionHistory.updateStatus(actionHistory.id, 'failed');
                }
                
                // Set status to FAILED
                await Device.updateWithCommandStatus(id, { 
                    status: 'failed'
                });
                
                socketService.broadcastDeviceStatus({
                    device_id: id,
                    status: 'failed',
                    value: previousValue,
                    error: 'Command failed',
                    timestamp: new Date()
                });

                return res.status(500).json({
                    success: false,
                    message: 'Failed to send command to device',
                    error: error.message
                });
            }
        } catch (error) {
            next(error);
        }
    }

    // Toggle auto_toggle for device
    static async toggleAutoMode(req, res, next) {
        try {
            const { id } = req.params;
            
            const device = await Device.getById(id);
            if (!device) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found'
                });
            }

            // Toggle auto_toggle: 1 (AUTO) <-> 0 (MANUAL)
            const newAutoToggle = device.auto_toggle === 1 ? 0 : 1;
            
            // Create action history for auto mode toggle
            await ActionHistory.create({
                device_id: id,
                command: newAutoToggle === 1 ? 'ENABLE_AUTO' : 'DISABLE_AUTO',
                executor: 'user',
                status: 'success'
            });
            
            await Device.updateAutoToggle(id, newAutoToggle);

            // Get updated device
            const updatedDevice = await Device.getById(id);

            // Broadcast via Socket
            socketService.broadcastDeviceStatus({
                device_id: updatedDevice.id,
                auto_toggle: newAutoToggle === 1,
                timestamp: new Date()
            });

            res.json({
                success: true,
                message: `Device auto-toggle ${newAutoToggle === 1 ? 'ENABLED' : 'DISABLED'}`,
                data: updatedDevice
            });
        } catch (error) {
            next(error);
        }
    }

    // Get all devices with pagination, search, filters (Admin only)
    static async getAll(req, res, next) {
        try {
            // Map frontend field names to database column names
            const orderByMap = {
                'timestamp': 'created_at',
                'created_at': 'created_at',
                'name': 'name',
                'status': 'status'
            };
            
            const rawOrderBy = req.query.sortBy || req.query.orderBy || 'created_at';
            const orderBy = orderByMap[rawOrderBy] || 'created_at';
            
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                search: req.query.search || '',
                orderBy: orderBy,
                orderDir: (req.query.sortOrder || req.query.orderDirection || 'desc').toUpperCase(),
                filter: {
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
            const { name, status } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Name is required'
                });
            }

            const device = await Device.create(name, status || false);

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