const DataSensor = require('../models/dataSensorModel');
const Alert = require('../models/alertModel');
const ActionHistory = require('../models/actionHistoryModel');

class DataCleanupService {
  // Schedule automatic cleanup
  static startScheduledCleanup() {
    // Run cleanup every day at 2:00 AM
    const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

    setInterval(async () => {
      const now = new Date();
      if (now.getHours() === 2) {
        await this.performCleanup();
      }
    }, CLEANUP_INTERVAL);

    console.log('🗓️ Scheduled data cleanup service started');
  }

  // Perform cleanup
  static async performCleanup() {
    try {
      console.log('🧹 Starting data cleanup...');

      // Clean sensor data older than 30 days
      const sensorDataDeleted = await DataSensor.deleteOldData(30);
      console.log(`✅ Deleted ${sensorDataDeleted} old sensor data records`);

      // Clean alerts older than 30 days
      const alertsDeleted = await Alert.deleteOldAlerts(30);
      console.log(`✅ Deleted ${alertsDeleted} old alert records`);

      // Clean action history older than 90 days
      const actionsDeleted = await ActionHistory.deleteOldActions(90);
      console.log(`✅ Deleted ${actionsDeleted} old action history records`);

      console.log('✅ Data cleanup completed');

      return {
        sensor_data: sensorDataDeleted,
        alerts: alertsDeleted,
        actions: actionsDeleted,
        total: sensorDataDeleted + alertsDeleted + actionsDeleted
      };
    } catch (error) {
      console.error('❌ Error during data cleanup:', error);
      throw error;
    }
  }

  // Manual cleanup
  static async manualCleanup(days = {}) {
    try {
      const {
        sensorDataDays = 30,
        alertDays = 30,
        actionDays = 90
      } = days;

      const results = {
        sensor_data: await DataSensor.deleteOldData(sensorDataDays),
        alerts: await Alert.deleteOldAlerts(alertDays),
        actions: await ActionHistory.deleteOldActions(actionDays)
      };

      results.total = results.sensor_data + results.alerts + results.actions;

      return results;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = DataCleanupService;