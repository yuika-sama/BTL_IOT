const BaseController = require('./baseController');
const Device = require('../models/deviceModel');
const ActionHistory = require('../models/actionHistoryModel');
const deviceService = require('../services/deviceService');
const socketService = require('../services/socketService');
const mqttService = require('../services/mqttService');
const ApiResponse = require('../utils/response');
const Logger = require('../utils/logger');
const config = require('../config');

class DeviceController extends BaseController {
    constructor() {
        super(deviceService);
    }

    // Dashboard: Get all devices info (only connected devices)
    getAllDevicesInfo = async (req, res, next) => {
        try {
            const devices = await Device.getAllDevicesInfo(true); // Only connected devices
            
            return ApiResponse.success(res, devices, 'Get all devices info successfully');
        } catch (error) {
            Logger.error('Error in getAllDevicesInfo:', error);
            next(error);
        }
    }

    // Dashboard: Toggle device status (ON/OFF) - MANUAL MODE
    toggleStatus = async (req, res, next) => {
        let actionHistory = null;
        
        try {
            const { id } = req.params;
            
            const device = await Device.getById(id);
            if (!device) {
                return ApiResponse.notFound(res, 'Device not found');
            }

            // Check if device is connected
            if (!device.is_connected) {
                return ApiResponse.serviceUnavailable(res, 'Device is not connected');
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
            // Map device ID to LED key using config
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
                return ApiResponse.success(res, {
                    id: id,
                    status: 'waiting',
                    value: previousValue,
                    target_value: newValue
                }, 'Device command sent, waiting for confirmation...');

            } catch (error) {
                Logger.error('Failed to send command:', error);
                
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

                return ApiResponse.error(res, 'Failed to send command to device', 500);
            }
        } catch (error) {
            Logger.error('Error in toggleStatus:', error);
            next(error);
        }
    }

    // Toggle auto_toggle for device
    toggleAutoMode = async (req, res, next) => {
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
    getAll = async (req, res, next) => {
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
            
            return ApiResponse.paginated(res, result.data, result.pagination, 'Get all devices successfully');
        } catch (error) {
            Logger.error('Error in getAll:', error);
            next(error);
        }
    }

    // Get device by ID (Admin only)
    getById = async (req, res, next) => {
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
    create = async (req, res, next) => {
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
    update = async (req, res, next) => {
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
    delete = async (req, res, next) => {
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

    // Override allowed filters
    getAllowedFilters() {
        return ['status', 'is_connected', 'type'];
    }
}

module.exports = new DeviceController();