const Sensor = require('../models/sensorModel');
const sensorService = require('../services/SensorService');

class SensorController {
    // Dashboard: Get latest values for 4 sensors (temperature, humidity, light, dust)
    static async getLatestValues(req, res, next) {
        try {
            const DataSensorModel = require('../models/dataSensorModel');
            
            const sensorIds = {
                temperature: process.env.SENSOR_TEMPERATURE_ID,
                humidity: process.env.SENSOR_HUMIDITY_ID,
                light: process.env.SENSOR_LIGHT_ID,
                dust: process.env.SENSOR_DUST_ID
            };

            const latestValues = {};

            for (const [type, sensorId] of Object.entries(sensorIds)) {
                if (!sensorId) {
                    console.warn(`⚠️  ${type.toUpperCase()}_ID not set in .env`);
                    latestValues[type] = null;
                    continue;
                }

                const data = await DataSensorModel.getLatestBySensor(sensorId);
                latestValues[type] = data || null;
            }
            
            res.json({
                success: true,
                message: 'Get latest sensor values successfully',
                data: latestValues
            });
        } catch (error) {
            console.error('❌ getLatestValues error:', error);
            next(error);
        }
    }

    // Get all sensors with pagination, search, filters (Admin only)
    static async getAll(req, res, next) {
        try {
            // Map frontend field names to database column names
            const orderByMap = {
                'timestamp': 'created_at',
                'created_at': 'created_at',
                'name': 'name'
            };
            
            const rawOrderBy = req.query.sortBy || req.query.orderBy || 'created_at';
            const orderBy = orderByMap[rawOrderBy] || 'created_at';
            
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                search: req.query.search || '',
                orderBy: orderBy,
                orderDirection: (req.query.sortOrder || req.query.orderDirection || 'desc').toUpperCase(),
                filters: {
                    device_id: req.query.deviceId || req.query.device_id || undefined,
                    name: req.query.name || undefined
                }
            };

            const result = await Sensor.getAll(options);
            
            res.json({
                success: true,
                message: 'Get all sensors successfully',
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    // Get sensor by ID (Admin only)
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const sensor = await Sensor.getById(id);

            if (!sensor) {
                return res.status(404).json({
                    success: false,
                    message: 'Sensor not found'
                });
            }

            res.json({
                success: true,
                message: 'Get sensor successfully',
                data: sensor
            });
        } catch (error) {
            next(error);
        }
    }

    // Get sensors by device ID (Admin only)
    static async getByDeviceId(req, res, next) {
        try {
            const { deviceId } = req.params;
            const sensors = await Sensor.getByDeviceId(deviceId);

            res.json({
                success: true,
                message: 'Get sensors by device successfully',
                data: sensors
            });
        } catch (error) {
            next(error);
        }
    }

    // Create new sensor (Admin only)
    static async create(req, res, next) {
        try {
            const { device_id, name, unit, threshold_min, threshold_max } = req.body;

            if (!device_id || !name || !unit) {
                return res.status(400).json({
                    success: false,
                    message: 'Device ID, name, and unit are required'
                });
            }

            const sensor = await Sensor.create({
                device_id,
                name,
                unit,
                threshold_min,
                threshold_max
            });

            res.status(201).json({
                success: true,
                message: 'Sensor created successfully',
                data: sensor
            });
        } catch (error) {
            next(error);
        }
    }

    // Update sensor (Admin only)
    static async update(req, res, next) {
        try {
            const { id } = req.params;
            const sensorData = req.body;

            const sensor = await Sensor.update(id, sensorData);

            res.json({
                success: true,
                message: 'Sensor updated successfully',
                data: sensor
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete sensor (Admin only)
    static async delete(req, res, next) {
        try {
            const { id } = req.params;
            const deleted = await Sensor.delete(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Sensor not found'
                });
            }

            res.json({
                success: true,
                message: 'Sensor deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = SensorController;