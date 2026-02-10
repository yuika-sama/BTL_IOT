const AlertModel = require('../models/alertModel');
const SensorModel = require('../models/sensorModel');
const SocketService = require('./socketService');

class AlertService {
  async checkThresholds(dataArray) {
    try {
      for (const data of dataArray) {
        const { sensor_id, value } = data;

        // Lấy thông tin sensor và ngưỡng
        const sensor = await SensorModel.findById(sensor_id);
        if (!sensor) continue;

        const { device_id, threshold_min, threshold_max, name } = sensor;

        if (!device_id) continue;
        if (threshold_min === null && threshold_max === null) continue;


        let shouldAlert = false;
        let alertType = '';
        let message = '';
        let description = '';

        // Kiểm tra ngưỡng
        if (threshold_max !== null && value > threshold_max) {
          shouldAlert = true;
          alertType = 'high';
          message = `${name} vượt ngưỡng cao: ${value} > ${threshold_max}`;
          description = `Giá trị ${value} vượt ngưỡng cao ${threshold_max}`;
        } else if (threshold_min !== null && value < threshold_min) {
          shouldAlert = true;
          alertType = 'low';
          message = `${name} dưới ngưỡng thấp: ${value} < ${threshold_min}`;
          description = `Giá trị ${value} dưới ngưỡng thấp ${threshold_min}`;
        }

        // Tạo alert nếu cần
        if (shouldAlert) {
          const alert = await AlertModel.create({
            sensor_id,
            device_id,
            severity: alertType,
            title: message,
            description: description,
            created_at: new Date()
          });

          console.log(`🚨 Alert created: ${message}`);

          // Broadcast alert qua Socket.IO
          SocketService.broadcastAlert({
            id: alert.id,
            sensor_id,
            sensor_name: name,
            type: alertType,
            message,
            value,
            threshold_min,
            threshold_max,
            timestamp: alert.created_at
          });
        }
      }
    } catch (error) {
      console.error('❌ Check thresholds error:', error.message);
    }
  }

  async getAlerts(filters = {}) {
    try {
      const { status, sensor_id, limit = 50, offset = 0 } = filters;
      return await AlertModel.findAll({ status, sensor_id, limit, offset });
    } catch (error) {
      throw error;
    }
  }

  async updateAlertStatus(id, status) {
    try {
      return await AlertModel.updateStatus(id, status);
    } catch (error) {
      throw error;
    }
  }

  async deleteAlert(id) {
    try {
      return await AlertModel.delete(id);
    } catch (error) {
      throw error;
    }
  }

  async getAlertStatistics(days = 7) {
    try {
      const stats = await AlertModel.getStatistics();
      return stats;
    } catch (error) {
      throw error;
    }
  }
}

// Export instance (singleton)
module.exports = new AlertService();