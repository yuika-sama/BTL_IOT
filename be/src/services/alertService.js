const Alert = require('../models/alertModel');
const socketService = require('./socketService');

class AlertService {
  // Create and broadcast alert
  static async createAlert(alertData) {
    try {
      // Use model method
      const alert = await Alert.create(alertData);

      // Broadcast to WebSocket clients
      socketService.broadcast('new_alert', alert);
      socketService.emitToDevice(alertData.device_id, 'device_alert', alert);
      socketService.emitToSensor(alertData.sensor_id, 'sensor_alert', alert);

      return alert;
    } catch (error) {
      throw error;
    }
  }

  // Get alert statistics
  static async getAlertStatistics(days = 7) {
    try {
      // Use model method
      const stats = await Alert.getStatistics(days);

      // Group by severity
      const severityCounts = {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        CRITICAL: 0
      };

      stats.forEach(stat => {
        if (severityCounts.hasOwnProperty(stat.severity)) {
          severityCounts[stat.severity] += stat.count;
        }
      });

      return {
        by_severity: severityCounts,
        by_date: stats,
        total: Object.values(severityCounts).reduce((a, b) => a + b, 0)
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = AlertService;