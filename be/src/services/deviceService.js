const Device = require('../models/deviceModel');
const ActionHistory = require('../models/actionHistoryModel');
const mqttService = require('./mqttService');
const socketService = require('./socketService');

class DeviceService {
  // Toggle device status with action history
  static async toggleDevice(deviceId, status, executor = 'system') {
    let actionHistory = null;
    
    try {
      // Get device first to check if exists
      const existingDevice = await Device.getById(deviceId);
      if (!existingDevice) {
        throw new Error('Device not found');
      }

      // Create action history with 'waiting' status
      actionHistory = await ActionHistory.create({
        device_id: deviceId,
        command: status ? 'ON' : 'OFF',
        executor: executor,
        status: 'waiting'
      });

      // Update device status in database
      const device = await Device.updateStatus(deviceId, status);

      // Publish to MQTT
      try {
        await mqttService.publishDeviceCommand(deviceId, status ? 'ON' : 'OFF');
        
        // Update action history to success after publishing
        await ActionHistory.updateStatus(actionHistory.id, 'success');
      } catch (mqttError) {
        console.error('MQTT publish error:', mqttError);
        // Update action history to failed
        await ActionHistory.updateStatus(actionHistory.id, 'failed');
        throw new Error('Failed to send command to device');
      }

      // Broadcast to WebSocket clients
      socketService.broadcast('device_toggled', {
        device_id: deviceId,
        device_name: device.name,
        status: status,
        executor: executor
      });

      socketService.emitToDevice(deviceId, 'device_status_changed', {
        status: status,
        executor: executor
      });

      // Get updated action history
      const updatedAction = await ActionHistory.getById(actionHistory.id);

      return {
        device,
        action: updatedAction
      };
    } catch (error) {
      // Update action history to failed if exists
      if (actionHistory && actionHistory.id) {
        try {
          await ActionHistory.updateStatus(actionHistory.id, 'failed');
        } catch (historyError) {
          console.error('Error updating action history:', historyError);
        }
      }
      throw error;
    }
  }

  // Get device statistics for dashboard
  static async getDeviceStatistics() {
    try {
      const devices = await Device.getAllDevicesInfo();

      const stats = {
        total: devices.length,
        online: devices.filter(d => d.is_connected).length,
        offline: devices.filter(d => !d.is_connected).length,
        active: devices.filter(d => d.status).length,
        inactive: devices.filter(d => !d.status).length
      };

      return stats;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = DeviceService;