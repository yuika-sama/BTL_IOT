const DataSensor = require('../models/dataSensorModel');
const ApiResponse = require('../utils/response');
const Logger = require('../utils/logger');
const config = require('../config');

class DataSensorController {
    // Data Sensor Page: Get history of 4 sensor types
    static async getSensorHistory(req, res, next) {
        try {
            // Get 4 sensor IDs from config
            const sensorIds = [
                config.sensors.temperature,
                config.sensors.humidity,
                config.sensors.light,
                config.sensors.dust
            ].filter(id => id);

            if (sensorIds.length === 0) {
                return ApiResponse.badRequest(res, 'No sensor IDs configured in environment variables');
            }

            // Map frontend sortBy to database column names
            const sortByMap = {
                'timestamp': 'created_at',
                'temperature': 'temperature',
                'humidity': 'humidity',
                'light': 'light',
                'dust': 'dust'
            };
            
            const sortBy = req.query.sortBy || 'timestamp';
            const orderBy = sortByMap[sortBy] || 'created_at';
            
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                search: req.query.search || '',
                filterType: req.query.filterType || '',
                orderBy: orderBy,
                orderDirection: (req.query.sortOrder || 'desc').toUpperCase(),
            };
            
            const result = await DataSensor.getSensorHistory(sensorIds, options);
            return ApiResponse.success(res, result, 'Get sensor history successfully');
        } catch (error) {
            Logger.error('Error in getSensorHistory:', error);
            next(error);
        }
    }

    // Get aggregate data for charts
    static async getAggregateData(req, res, next) {
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
    static async getInitialChartData(req, res, next) {
        try {
            const { limit = 20 } = req.query;
            const sensorIds = config.sensors;

            // Validate sensor IDs
            const missingSensors = Object.entries(sensorIds)
                .filter(([_, value]) => !value)
                .map(([key, _]) => key);

            if (missingSensors.length > 0) {
                Logger.warn('Missing sensor IDs in .env:', missingSensors);
            }

            // Fetch data for each sensor
            const [temperatureData, humidityData, lightData, dustData] = await Promise.all([
                sensorIds.temperature ? DataSensor.getLatestDataBySensorId(sensorIds.temperature, parseInt(limit)) : [],
                sensorIds.humidity ? DataSensor.getLatestDataBySensorId(sensorIds.humidity, parseInt(limit)) : [],
                sensorIds.light ? DataSensor.getLatestDataBySensorId(sensorIds.light, parseInt(limit)) : [],
                sensorIds.dust ? DataSensor.getLatestDataBySensorId(sensorIds.dust, parseInt(limit)) : []
            ]);

            return ApiResponse.success(res, {
                temperature: temperatureData || [],
                humidity: humidityData || [],
                light: lightData || [],
                dust: dustData || []
            }, 'Get initial chart data successfully');
        } catch (error) {
            Logger.error('Error in getInitialChartData:', error);
            next(error);
        }
    }
}

module.exports = DataSensorController;