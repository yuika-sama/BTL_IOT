const Sensor = require('../models/sensorModel');

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

      // Use model method
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
}

module.exports = SensorService;