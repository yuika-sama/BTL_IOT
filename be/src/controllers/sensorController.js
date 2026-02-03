const Sensor = require('../models/sensorModel');

class SensorController {
    // Get all sensors with pagination, search, filters
    static async getAll(req, res, next) {
        try {
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                search: req.query.search || '',
                orderBy: req.query.orderBy || 'created_at',
                orderDirection: req.query.orderDirection || 'DESC',
                filters: {
                    device_id: req.query.device_id || undefined,
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

    // Dashboard: Get latest values for 4 sensors (temperature, humidity, light, dust)
    static async getLatestValues(req, res, next) {
        try {
            // Get sensor IDs from environment variables
            const sensorIds = [
                process.env.SENSOR_TEMPERATURE_ID,
                process.env.SENSOR_HUMIDITY_ID,
                process.env.SENSOR_LIGHT_ID,
                process.env.SENSOR_DUST_ID
            ].filter(id => id); // Remove undefined values

            if (sensorIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Sensor IDs not configured in environment variables'
                });
            }

            const sensors = await Sensor.getLatestValuesByIds(sensorIds);
            
            res.json({
                success: true,
                message: 'Get latest sensor values successfully',
                data: sensors
            });
        } catch (error) {
            next(error);
        }
    }

    // Get sensor by ID
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

    // Get sensors by device ID
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

    // Create new sensor
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

    // Update sensor
    static async update(req, res, next) {
        try {
            const { id } = req.params;
            const sensorData = req.body;

            const sensor = await Sensor.update(id, sensorData);

            if (!sensor) {
                return res.status(404).json({
                    success: false,
                    message: 'Sensor not found'
                });
            }

            res.json({
                success: true,
                message: 'Sensor updated successfully',
                data: sensor
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete sensor
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