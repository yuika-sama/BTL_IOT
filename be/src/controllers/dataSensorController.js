const DataSensor = require('../models/dataSensorModel');

class DataSensorController {
    // Get all sensor data with pagination, search, filters
    static async getAll(req, res, next) {
        try {
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                search: req.query.search || '',
                orderBy: req.query.orderBy || 'created_at',
                orderDirection: req.query.orderDirection || 'DESC',
                filters: {
                    sensor_id: req.query.sensor_id || undefined,
                    device_id: req.query.device_id || undefined,
                    sensor_name: req.query.sensor_name || undefined,
                    startDate: req.query.startDate || undefined,
                    endDate: req.query.endDate || undefined
                }
            };

            const result = await DataSensor.getAll(options);
            
            res.json({
                success: true,
                message: 'Get all sensor data successfully',
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    // Data Sensor Page: Get history of 4 sensor types
    static async getSensorHistory(req, res, next) {
        try {
            // Lấy 4 sensor IDs từ environment variables
            const sensorIds = [
                process.env.SENSOR_TEMPERATURE_ID,
                process.env.SENSOR_HUMIDITY_ID,
                process.env.SENSOR_LIGHT_ID,
                process.env.SENSOR_DUST_ID
            ].filter(id => id); // Filter out undefined IDs

            if (sensorIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No sensor IDs configured in environment variables'
                });
            }

            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                search: req.query.search || '',
                orderBy: req.query.sortBy || 'created_at',
                orderDirection: req.query.sortOrder?.toUpperCase() || 'DESC',
                filters: {
                    startDate: req.query.startDate,
                    endDate: req.query.endDate
                }
            };
            
            const result = await DataSensor.getSensorHistory(sensorIds, options);
            
            res.json({
                success: true,
                message: 'Get sensor history successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    // Get aggregate data for charts
    static async getAggregateData(req, res, next) {
        try {
            const { sensorId } = req.params;
            const { interval = 'hour', limit = 24 } = req.query;
            
            const data = await DataSensor.getAggregateData(sensorId, interval, parseInt(limit));
            
            res.json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    // Get sensor data by ID
    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const data = await DataSensor.getById(id);

            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: 'Sensor data not found'
                });
            }

            res.json({
                success: true,
                message: 'Get sensor data successfully',
                data: data
            });
        } catch (error) {
            next(error);
        }
    }

    // Get sensor data by sensor ID
    static async getBySensorId(req, res, next) {
        try {
            const { sensorId } = req.params;
            const data = await DataSensor.getBySensorId(sensorId);

            res.json({
                success: true,
                message: 'Get sensor data by sensor ID successfully',
                data: data
            });
        } catch (error) {
            next(error);
        }
    }

    // Get latest sensor data by sensor ID
    static async getLatest(req, res, next) {
        try {
            const { sensorId } = req.params;
            const data = await DataSensor.getLatestBySensorId(sensorId);

            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: 'No data found for this sensor'
                });
            }

            res.json({
                success: true,
                message: 'Get latest sensor data successfully',
                data: data
            });
        } catch (error) {
            next(error);
        }
    }

    // Get aggregate data (hourly, daily, monthly)
    static async getAggregateData(req, res, next) {
        try {
            const { sensorId } = req.params;
            const { interval = 'hourly', limit = 24 } = req.query;

            const data = await DataSensor.getAggregateData(
                sensorId, 
                interval, 
                parseInt(limit)
            );

            res.json({
                success: true,
                message: 'Get aggregate data successfully',
                data: data
            });
        } catch (error) {
            next(error);
        }
    }

    // Get statistics
    static async getStatistics(req, res, next) {
        try {
            const { sensorId } = req.params;
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Start date and end date are required'
                });
            }

            const stats = await DataSensor.getStatistics(sensorId, startDate, endDate);

            res.json({
                success: true,
                message: 'Get statistics successfully',
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    // Create new sensor data (usually from MQTT)
    static async create(req, res, next) {
        try {
            const { sensor_id, value } = req.body;

            if (!sensor_id || value === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Sensor ID and value are required'
                });
            }

            const data = await DataSensor.create({ sensor_id, value });

            res.status(201).json({
                success: true,
                message: 'Sensor data created successfully',
                data: data
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete sensor data
    static async delete(req, res, next) {
        try {
            const { id } = req.params;
            const deleted = await DataSensor.delete(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Sensor data not found'
                });
            }

            res.json({
                success: true,
                message: 'Sensor data deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete old data
    static async deleteOldData(req, res, next) {
        try {
            const { days = 30 } = req.query;
            const deletedCount = await DataSensor.deleteOldData(parseInt(days));

            res.json({
                success: true,
                message: `Deleted ${deletedCount} old sensor data records`,
                deletedCount: deletedCount
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = DataSensorController;