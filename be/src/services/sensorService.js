const Sensor = require('../models/sensorModel');
const DataSensor = require('../models/dataSensorModel');
const Alert = require('../models/alertModel');
const websocketService = require('./websocketService');

class SensorService {
  // Get dashboard sensor data (latest 10 minutes)
  static async getDashboardData() {
    try {
      const sensorIds = [
        process.env.SENSOR_TEMPERATURE_ID,
        process.env.SENSOR_HUMIDITY_ID,
        process.env.SENSOR_LIGHT_ID,
        process.env.SENSOR_DUST_ID
      ].filter(id => id);

      if (sensorIds.length === 0) {
        throw new Error('Sensor IDs not configured in environment variables');
      }

      const sensors = await Sensor.getLatestValuesByIds(sensorIds);

      // Format data for dashboard
      const dashboardData = {
        temperature: sensors.find(s => s.sensor_id === process.env.SENSOR_TEMPERATURE_ID) || null,
        humidity: sensors.find(s => s.sensor_id === process.env.SENSOR_HUMIDITY_ID) || null,
        light: sensors.find(s => s.sensor_id === process.env.SENSOR_LIGHT_ID) || null,
        dust: sensors.find(s => s.sensor_id === process.env.SENSOR_DUST_ID) || null,
        timestamp: new Date()
      };

      return dashboardData;
    } catch (error) {
      throw error;
    }
  }

  // Update sensor threshold
  static async updateThreshold(sensorId, thresholdMin, thresholdMax) {
    try {
      const sensor = await Sensor.update(sensorId, {
        threshold_min: thresholdMin,
        threshold_max: thresholdMax
      });

      if (!sensor) {
        throw new Error('Sensor not found');
      }

      // Broadcast to WebSocket clients
      websocketService.broadcast('sensor_threshold_updated', {
        sensor_id: sensorId,
        threshold_min: thresholdMin,
        threshold_max: thresholdMax
      });

      websocketService.emitToSensor(sensorId, 'threshold_updated', {
        threshold_min: thresholdMin,
        threshold_max: thresholdMax
      });

      return sensor;
    } catch (error) {
      throw error;
    }
  }

  // Get sensor statistics
  static async getSensorStatistics(sensorId, days = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await DataSensor.getStatistics(
        sensorId,
        startDate.toISOString(),
        endDate.toISOString()
      );

      // Get alert count
      const alerts = await Alert.getBySensorId(sensorId, 1000);
      const alertCount = alerts.length;

      return {
        ...stats,
        alert_count: alertCount,
        period_days: days
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = SensorService;