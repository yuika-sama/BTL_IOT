const BaseController = require('./baseController');
const DataSensor = require('../models/dataSensorModel');
const ApiResponse = require('../utils/response');
const Logger = require('../utils/logger');
const config = require('../config');

class DataSensorController extends BaseController {
    constructor() {
        super(null); // No specific service for now
    }

    // Get all sensor data with pagination, search, filters
    getAll = async (req, res, next) => {
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
                orderBy: orderBy,
                orderDirection: (req.query.sortOrder || req.query.orderDirection || 'desc').toUpperCase(),
                filters: {
                    sensor_id: req.query.sensorId || req.query.sensor_id || undefined,
                    device_id: req.query.deviceId || req.query.device_id || undefined,
                    sensor_name: req.query.sensor_name || undefined,
                    startDate: req.query.startDate || undefined,
                    endDate: req.query.endDate || undefined
                }
            };

            const result = await DataSensor.getAll(options);
            
            return ApiResponse.paginated(res, result.data, result.pagination, 'Get all sensor data successfully');
        } catch (error) {
            Logger.error('Error in getAll:', error);
            next(error);
        }
    }

    // Data Sensor Page: Get history of 4 sensor types
    getSensorHistory = async (req, res, next) => {
        try {
            // Lấy 4 sensor IDs từ config
            const sensorIds = [
                config.sensors.temperature,
                config.sensors.humidity,
                config.sensors.light,
                config.sensors.dust
            ].filter(id => id); // Filter out undefined IDs

            if (sensorIds.length === 0) {
                return ApiResponse.badRequest(res, 'No sensor IDs configured in environment variables');
            }

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
            
            const result = await DataSensor.getSensorHistory(sensorIds, options);
            
            return ApiResponse.success(res, result, 'Get sensor history successfully');
        } catch (error) {
            Logger.error('Error in getSensorHistory:', error);
            next(error);
        }
    }

    // Get aggregate data for charts
    getAggregateData = async (req, res, next) => {
        try {
            const { sensorId } = req.params;
            const { interval = 'hour', limit = 24 } = req.query;
            
            const data = await DataSensor.getAggregateData(sensorId, interval, parseInt(limit));
            
            return ApiResponse.success(res, data, 'Get aggregate data successfully');
        } catch (error) {
            Logger.error('Error in getAggregateData:', error);
            next(error);
        }
    }

    // Get initial chart data for all 4 sensors
    getInitialChartData = async (req, res, next) => {
        try {
            const { limit = 20 } = req.query;
            
            // Lấy 4 sensor IDs từ config
            const sensorIds = config.sensors;

            // Validate sensor IDs
            const missingSensors = [];
            Object.entries(sensorIds).forEach(([key, value]) => {
                if (!value) missingSensors.push(key);
            });

            if (missingSensors.length > 0) {
                Logger.warn('Missing sensor IDs in .env:', missingSensors);
            }

            // Lấy dữ liệu cho từng sensor (chỉ nếu có ID)
            const [temperatureData, humidityData, lightData, dustData] = await Promise.all([
                sensorIds.temperature 
                    ? DataSensor.getLatestDataBySensorId(sensorIds.temperature, parseInt(limit))
                    : Promise.resolve([]),
                sensorIds.humidity 
                    ? DataSensor.getLatestDataBySensorId(sensorIds.humidity, parseInt(limit))
                    : Promise.resolve([]),
                sensorIds.light 
                    ? DataSensor.getLatestDataBySensorId(sensorIds.light, parseInt(limit))
                    : Promise.resolve([]),
                sensorIds.dust 
                    ? DataSensor.getLatestDataBySensorId(sensorIds.dust, parseInt(limit))
                    : Promise.resolve([])
            ]);

            Logger.info('Initial chart data:', {
                temperature: temperatureData?.length || 0,
                humidity: humidityData?.length || 0,
                light: lightData?.length || 0,
                dust: dustData?.length || 0
            });

            return ApiResponse.success(res, {
                temperature: temperatureData || [],
                humidity: humidityData || [],
                light: lightData || [],
                dust: dustData || []
            });
        } catch (error) {
            Logger.error('Error in getInitialChartData:', error);
            next(error);
        }
    }

    // Get sensor data by ID
    getById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await DataSensor.getById(id);

            if (!data) {
                return ApiResponse.notFound(res, 'Sensor data not found');
            }

            return ApiResponse.success(res, data, 'Get sensor data successfully');
        } catch (error) {
            Logger.error('Error in getById:', error);
            next(error);
        }
    }

    // Get sensor data by sensor ID
    getBySensorId = async (req, res, next) => {
        try {
            const { sensorId } = req.params;
            const data = await DataSensor.getBySensorId(sensorId);

            return ApiResponse.success(res, data, 'Get sensor data by sensor ID successfully');
        } catch (error) {
            Logger.error('Error in getBySensorId:', error);
            next(error);
        }
    }

    // Get latest sensor data by sensor ID
    getLatest = async (req, res, next) => {
        try {
            const { sensorId } = req.params;
            const data = await DataSensor.getLatestBySensorId(sensorId);

            if (!data) {
                return ApiResponse.notFound(res, 'No data found for this sensor');
            }

            return ApiResponse.success(res, data, 'Get latest sensor data successfully');
        } catch (error) {
            Logger.error('Error in getLatest:', error);
            next(error);
        }
    }

    // Get statistics
    getStatistics = async (req, res, next) => {
        try {
            const { sensorId } = req.params;
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return ApiResponse.badRequest(res, 'Start date and end date are required');
            }

            const stats = await DataSensor.getStatistics(sensorId, startDate, endDate);

            return ApiResponse.success(res, stats, 'Get statistics successfully');
        } catch (error) {
            Logger.error('Error in getStatistics:', error);
            next(error);
        }
    }

    // Create new sensor data (usually from MQTT)
    create = async (req, res, next) => {
        try {
            const { sensor_id, value } = req.body;

            if (!sensor_id || value === undefined) {
                return ApiResponse.badRequest(res, 'Sensor ID and value are required');
            }

            const data = await DataSensor.create({ sensor_id, value });

            return ApiResponse.created(res, data, 'Sensor data created successfully');
        } catch (error) {
            Logger.error('Error in create:', error);
            next(error);
        }
    }

    // Delete sensor data
    delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const deleted = await DataSensor.delete(id);

            if (!deleted) {
                return ApiResponse.notFound(res, 'Sensor data not found');
            }

            return ApiResponse.success(res, null, 'Sensor data deleted successfully');
        } catch (error) {
            Logger.error('Error in delete:', error);
            next(error);
        }
    }

    // Delete old data
    deleteOldData = async (req, res, next) => {
        try {
            const { days = 30 } = req.query;
            const deletedCount = await DataSensor.deleteOldData(parseInt(days));

            return ApiResponse.success(res, { deletedCount }, `Deleted ${deletedCount} old sensor data records`);
        } catch (error) {
            Logger.error('Error in deleteOldData:', error);
            next(error);
        }
    }

    // Override allowed filters
    getAllowedFilters() {
        return ['sensor_id', 'sensorId', 'device_id', 'deviceId', 'sensor_name', 'filterType'];
    }
}

module.exports = new DataSensorController();