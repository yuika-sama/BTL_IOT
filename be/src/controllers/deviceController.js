const Device = require('../models/deviceModel');
const ActionHistory = require('../models/actionHistoryModel');
const socketService = require('../services/socketService');
const mqttService = require('../services/mqttService');
const ApiResponse = require('../utils/response');
const Logger = require('../utils/logger');
const config = require('../config');

class DeviceController {
    // Dashboard: Get all devices info (only connected devices)
    static async getAllDevicesInfo(req, res, next) {
        try {
            const devices = await Device.getAllDevicesInfo(true); // Only connected devices
            
            return ApiResponse.success(res, devices, 'Get all devices info successfully');
        } catch (error) {
            Logger.error('Error in getAllDevicesInfo:', error);
            next(error);
        }
    }

    // Dashboard: Toggle device status (ON/OFF) - MANUAL MODE
    static async toggleStatus(req, res, next) {
        try {
            const { id } = req.params;
            
            // Get device and validate
            const device = await Device.getById(id);
            if (!device) {
                return ApiResponse.notFound(res, 'Device not found');
            }

            if (!device.is_connected) {
                return ApiResponse.serviceUnavailable(res, 'Device is not connected');
            }

            // Calculate new value
            const newValue = device.value === 1 ? 0 : 1;
            const previousValue = device.value;
            
            // Create action history with 'waiting' status
            const actionHistory = await ActionHistory.create({
                device_id: id,
                command: newValue === 1 ? 'ON' : 'OFF',
                executor: 'user',
                status: 'waiting'
            });
            
            // Update device status to WAITING and disable auto_toggle
            await Device.updateWithCommandStatus(id, { status: 'waiting' });
            await Device.update(id, { auto_toggle: 0 });
            
            // Broadcast WAITING state to frontend
            socketService.broadcastDeviceStatus({
                device_id: id,
                status: 'waiting',
                value: previousValue,
                timestamp: new Date()
            });

            // Send MQTT command
            const ledMapping = {
                [config.devices.temperature]: 'led_temp',
                [config.devices.humidity]: 'led_hum',
                [config.devices.light]: 'led_ldr',
                [config.devices.dust]: 'led_dust'
            };

            const ledKey = ledMapping[id];
            if (!ledKey) {
                return ApiResponse.badRequest(res, 'Invalid device type or device not configured');
            }

            try {
                await mqttService.publishCommandWithTracking(
                    'abcde1', 
                    ledKey, 
                    newValue, 
                    id,
                    10000,
                    actionHistory.id
                );

                return ApiResponse.success(res, {
                    id: id,
                    status: 'waiting',
                    value: previousValue,
                    target_value: newValue
                }, 'Device command sent, waiting for confirmation...');

            } catch (error) {
                Logger.error('Failed to send command:', error);
                
                // Update to failed state
                if (actionHistory?.id) {
                    await ActionHistory.updateStatus(actionHistory.id, 'failed');
                }
                await Device.updateWithCommandStatus(id, { status: 'failed' });
                
                socketService.broadcastDeviceStatus({
                    device_id: id,
                    status: 'failed',
                    value: previousValue,
                    error: 'Command failed',
                    timestamp: new Date()
                });

                return ApiResponse.error(res, 'Failed to send command to device', 500);
            }
        } catch (error) {
            Logger.error('Error in toggleStatus:', error);
            next(error);
        }
    }

    // Toggle auto_toggle for device
    static async toggleAutoMode(req, res, next) {
        try {
            const { id } = req.params;
            
            const device = await Device.getById(id);
            if (!device) {
                return ApiResponse.notFound(res, 'Device not found');
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

            return ApiResponse.success(
                res, 
                updatedDevice, 
                `Device auto-toggle ${newAutoToggle === 1 ? 'ENABLED' : 'DISABLED'}`
            );
        } catch (error) {
            Logger.error('Error in toggleAutoMode:', error);
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
                orderBy: req.query.sortBy || 'created_at',
                orderDir: (req.query.sortOrder || 'desc').toUpperCase(),
                filter: {
                    status: req.query.status !== undefined ? req.query.status === 'true' : undefined,
                    is_connected: req.query.is_connected !== undefined ? req.query.is_connected === 'true' : undefined,
                    type: req.query.type || undefined
                }
            };

            const result = await Device.getAll(options);
            return ApiResponse.paginated(res, result.data, result.pagination, 'Get all devices successfully');
        } catch (error) {
            Logger.error('Error in getAll:', error);
            next(error);
        }
    }

    // Get device by ID (Admin only)
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const device = await Device.getById(id);

            if (!device) {
                return ApiResponse.notFound(res, 'Device not found');
            }

            return ApiResponse.success(res, device, 'Get device successfully');
        } catch (error) {
            Logger.error('Error in getById:', error);
            next(error);
        }
    }

    // Create new device (Admin only)
    static async create(req, res, next) {
        try {
            const { name, status } = req.body;

            if (!name) {
                return ApiResponse.badRequest(res, 'Name is required');
            }

            const device = await Device.create(name, status || false);

            return ApiResponse.created(res, device, 'Device created successfully');
        } catch (error) {
            Logger.error('Error in create:', error);
            next(error);
        }
    }

    // Update device (Admin only)
    static async update(req, res, next) {
        try {
            const { id } = req.params;
            const deviceData = req.body;

            const device = await Device.update(id, deviceData);

            return ApiResponse.success(res, device, 'Device updated successfully');
        } catch (error) {
            Logger.error('Error in update:', error);
            next(error);
        }
    }

    // Delete device (Admin only)
    static async delete(req, res, next) {
        try {
            const { id } = req.params;
            const deleted = await Device.delete(id);

            if (!deleted) {
                return ApiResponse.notFound(res, 'Device not found');
            }

            return ApiResponse.success(res, null, 'Device deleted successfully');
        } catch (error) {
            Logger.error('Error in delete:', error);
            next(error);
        }
    }
}

module.exports = DeviceController;