const Device = require('../models/deviceModel');
const ActionHistory = require('../models/actionHistoryModel');
const mqttService = require('./mqttService');
const websocketService = require('./websocketService');

class DeviceService {
  // Toggle device status with action history
  static async toggleDevice(deviceId, status, executor = 'system') {
    try {
      // Update device status
      const device = await Device.updateStatus(deviceId, status);

      if (!device) {
        throw new Error('Device not found');
      }

      // Create action history
      const actionHistory = await ActionHistory.create({
        device_id: deviceId,
        command: status ? 'ON' : 'OFF',
        executor: executor,
        status: 'waiting'
      });

      // Publish to MQTT
      await mqttService.publishDeviceCommand(deviceId, status ? 'ON' : 'OFF');

      // Update action history to success after publishing
      await ActionHistory.updateStatus(actionHistory.id, 'success');

      // Broadcast to WebSocket clients
      websocketService.broadcast('device_toggled', {
        device_id: deviceId,
        device_name: device.name,
        status: status,
        executor: executor
      });

      websocketService.emitToDevice(deviceId, 'device_status_changed', {
        status: status,
        executor: executor
      });

      return {
        device,
        action: await ActionHistory.getById(actionHistory.id)
      };
    } catch (error) {
      // Update action history to failed
      try {
        if (actionHistory && actionHistory.id) {
          await ActionHistory.updateStatus(actionHistory.id, 'failed');
        }
      } catch (historyError) {
        console.error('Error updating action history:', historyError);
      }
      throw error;
    }
  }

  // Update device connection status
  static async updateConnection(deviceId, isConnected) {
    try {
      const device = await Device.updateConnection(deviceId, isConnected);

      if (!device) {
        throw new Error('Device not found');
      }

      // Broadcast to WebSocket clients
      websocketService.broadcast('device_connection_changed', {
        device_id: deviceId,
        device_name: device.name,
        is_connected: isConnected
      });

      websocketService.emitToDevice(deviceId, 'connection_status_changed', {
        is_connected: isConnected
      });

      return device;
    } catch (error) {
      throw error;
    }
  }

  // Get device statistics
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