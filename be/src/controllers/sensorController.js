const Sensor = require('../models/sensorModel');
const ApiResponse = require('../utils/response');
const Logger = require('../utils/logger');
const config = require('../config');

class SensorController {
    // Dashboard: Get latest values for 4 sensors (temperature, humidity, light, dust)
    static async getLatestValues(req, res, next) {
        try {
            const DataSensorModel = require('../models/dataSensorModel');
            const sensorIds = config.sensors;
            const latestValues = {};

            for (const [type, sensorId] of Object.entries(sensorIds)) {
                if (!sensorId) {
                    Logger.warn(`${type.toUpperCase()}_ID not set in .env`);
                    latestValues[type] = null;
                    continue;
                }

                const data = await DataSensorModel.getLatestBySensor(sensorId);
                latestValues[type] = data || null;
            }
            
            return ApiResponse.success(res, latestValues, 'Get latest sensor values successfully');
        } catch (error) {
            Logger.error('Error in getLatestValues:', error);
            next(error);
        }
    }

    // Get all sensors with pagination, search, filters (Admin only)
    static async getAll(req, res, next) {
        try {
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                search: req.query.search || '',
                sortBy: req.query.sortBy || 'created_at',
                sortOrder: (req.query.sortOrder || 'desc').toUpperCase(),
                filters: {
                    device_id: req.query.deviceId || req.query.device_id || undefined,
                    name: req.query.name || undefined
                }
            };

            const result = await Sensor.getAll(options);
            return ApiResponse.paginated(res, result.data, result.pagination, 'Get all sensors successfully');
        } catch (error) {
            Logger.error('Error in getAll:', error);
            next(error);
        }
    }

    // Get sensor by ID (Admin only)
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const sensor = await Sensor.getById(id);

            if (!sensor) {
                return ApiResponse.notFound(res, 'Sensor not found');
            }

            return ApiResponse.success(res, sensor, 'Get sensor successfully');
        } catch (error) {
            Logger.error('Error in getById:', error);
            next(error);
        }
    }

    // Get sensors by device ID (Admin only)
    static async getByDeviceId(req, res, next) {
        try {
            const { deviceId } = req.params;
            const sensors = await Sensor.getByDeviceId(deviceId);
            return ApiResponse.success(res, sensors, 'Get sensors by device successfully');
        } catch (error) {
            Logger.error('Error in getByDeviceId:', error);
            next(error);
        }
    }

    // Create new sensor (Admin only)
    static async create(req, res, next) {
        try {
            const { device_id, name, type, unit, threshold_min, threshold_max } = req.body;

            if (!device_id || !name || !unit) {
                return ApiResponse.badRequest(res, 'Device ID, name, and unit are required');
            }

            const sensor = await Sensor.create({
                device_id,
                name,
                type,
                unit,
                threshold_min,
                threshold_max
            });

            return ApiResponse.created(res, sensor, 'Sensor created successfully');
        } catch (error) {
            Logger.error('Error in create:', error);
            next(error);
        }
    }

    // Update sensor (Admin only)
    static async update(req, res, next) {
        try {
            const { id } = req.params;
            const sensorData = req.body;
            const sensor = await Sensor.update(id, sensorData);
            return ApiResponse.success(res, sensor, 'Sensor updated successfully');
        } catch (error) {
            Logger.error('Error in update:', error);
            next(error);
        }
    }

    // Delete sensor (Admin only)
    static async delete(req, res, next) {
        try {
            const { id } = req.params;
            const deleted = await Sensor.delete(id);

            if (!deleted) {
                return ApiResponse.notFound(res, 'Sensor not found');
            }

            return ApiResponse.success(res, null, 'Sensor deleted successfully');
        } catch (error) {
            Logger.error('Error in delete:', error);
            next(error);
        }
    }
}

module.exports = SensorController;