const Alert = require('../models/alertModel');
const websocketService = require('./websocketService');

class AlertService {
  // Create and broadcast alert
  static async createAlert(alertData) {
    try {
      const alert = await Alert.create(alertData);

      // Broadcast to WebSocket clients
      websocketService.broadcast('new_alert', alert);
      websocketService.emitToDevice(alertData.device_id, 'device_alert', alert);
      websocketService.emitToSensor(alertData.sensor_id, 'sensor_alert', alert);

      return alert;
    } catch (error) {
      throw error;
    }
  }

  // Get alert statistics
  static async getAlertStatistics(days = 7) {
    try {
      const stats = await Alert.getStatistics();

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

  // Clean old alerts
  static async cleanOldAlerts(days = 30) {
    try {
      const deletedCount = await Alert.deleteOldAlerts(days);
      
      console.log(`🧹 Cleaned ${deletedCount} old alerts (older than ${days} days)`);
      
      return deletedCount;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = AlertService;