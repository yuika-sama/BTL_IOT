const mqttClient = require('../config/mqtt');
const DataSensorModel = require('../models/dataSensorModel');
const DeviceModel = require('../models/deviceModel');
const AlertService = require('./alertService');
const SocketService = require('./socketService');

class MqttService {
  constructor() {
    this.pendingCommands = new Map(); // Store pending commands waiting for confirmation
    this.setupSubscriptions();
  }

  setupSubscriptions() {
    mqttClient.on('connect', () => {
      // Subscribe topic nhận data từ ESP32
      const dataTopic = process.env.MQTT_TOPIC_DEVICE_DATA;
      const statusTopic = process.env.MQTT_TOPIC_DEVICE_STATUS;
      
      mqttClient.subscribe(dataTopic, (err) => {
        if (err) {
          console.error('❌ Subscribe data topic failed:', err);
        } else {
          console.log('✅ Subscribed to:', dataTopic);
        }
      });

      // Subscribe to status confirmation topic
      mqttClient.subscribe(statusTopic, (err) => {
        if (err) {
          console.error('❌ Subscribe status topic failed:', err);
        } else {
          console.log('✅ Subscribed to:', statusTopic);
        }
      });
    });

    mqttClient.on('message', async (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        console.log('📩 Received from', topic, ':', payload);

        // Handle different topics
        if (topic === process.env.MQTT_TOPIC_DEVICE_DATA) {
          await this.handleDeviceData(payload);
        } else if (topic === process.env.MQTT_TOPIC_DEVICE_STATUS) {
          await this.handleDeviceStatus(payload);
        }
      } catch (error) {
        console.error('❌ Parse error:', error.message);
      }
    });
  }

  // Handle status confirmation from ESP32
  async handleDeviceStatus(payload) {
    const { device_id, leds } = payload;
    
    if (!leds) {
      console.warn('⚠️ No LED status in confirmation');
      return;
    }

    // Map LED status back to device IDs
    const ledDeviceMap = {
      'temp_led': process.env.DEVICE_TEMPERATURE_ID,
      'hum_led': process.env.DEVICE_HUMIDITY_ID,
      'ldr_led': process.env.DEVICE_LIGHT_ID,
      'dust_led': process.env.DEVICE_DUST_ID
    };

    for (const [ledKey, ledStatus] of Object.entries(leds)) {
      const deviceId = ledDeviceMap[ledKey];
      if (!deviceId) continue;

      // ledStatus can be "ON", "OFF", or boolean
      const value = (ledStatus === "ON" || ledStatus === true || ledStatus === 1) ? 1 : 0;

      // Check if there's a pending command
      const commandKey = `${deviceId}_${ledKey}`;
      if (this.pendingCommands.has(commandKey)) {
        const pendingCmd = this.pendingCommands.get(commandKey);
        
        // Update action history to success
        if (pendingCmd.actionHistoryId) {
          const ActionHistory = require('../models/actionHistoryModel');
          await ActionHistory.updateStatus(pendingCmd.actionHistoryId, 'success');
        }
        
        // Update value and status to success
        await DeviceModel.updateWithCommandStatus(deviceId, {
          value: value,
          status: 'success'
        });
        
        // Broadcast success
        SocketService.broadcastDeviceStatus({
          device_id: deviceId,
          value: value,
          status: 'success',
          confirmed: true,
          timestamp: new Date()
        });

        console.log(`✅ Device ${deviceId} confirmed: ${value === 1 ? 'ON' : 'OFF'}`);
        
        // Clear timeout and remove from pending
        clearTimeout(pendingCmd.timeout);
        this.pendingCommands.delete(commandKey);
      } else {
        // Direct value update from ESP32 (not from command)
        await DeviceModel.updateWithCommandStatus(deviceId, {
          value: value,
          status: 'success'
        });
        
        SocketService.broadcastDeviceStatus({
          device_id: deviceId,
          value: value,
          status: 'success',
          timestamp: new Date()
        });
      }
    }
  }

  async handleDeviceData(payload) {
    const { device_id, sensors, leds } = payload;

    if (!sensors) {
      console.warn('⚠️ No sensors data');
      return;
    }

    // Map sensor types sang sensor_id từ env
    const sensorMap = {
      temperature: { id: process.env.SENSOR_TEMPERATURE_ID, type: 'temperature', unit: '°C' },
      humidity: { id: process.env.SENSOR_HUMIDITY_ID, type: 'humidity', unit: '%' },
      light_raw: { id: process.env.SENSOR_LIGHT_ID, type: 'light', unit: 'lux' },
      dust_ugm3: { id: process.env.SENSOR_DUST_ID, type: 'dust', unit: 'PM2.5' },
    };

    const dataToSave = [];
    const timestamp = new Date();

    for (const [sensorKey, value] of Object.entries(sensors)) {
      const sensorInfo = sensorMap[sensorKey];
      if (sensorInfo?.id && value !== null && value !== undefined) {
        const parsedValue = parseFloat(value);
        
        // Lưu vào DB
        dataToSave.push({
          sensor_id: sensorInfo.id,
          value: parsedValue,
          timestamp,
        });

        // Broadcast từng sensor riêng lẻ qua Socket (theo format frontend mong đợi)
        SocketService.broadcastSensorData({
          sensor_id: sensorInfo.id,
          device_id,
          type: sensorInfo.type,
          value: parsedValue,
          unit: sensorInfo.unit,
          timestamp
        });
      }
    }

    // Lưu vào DB
    if (dataToSave.length > 0) {
      for (const data of dataToSave) {
        await DataSensorModel.create(data);
      }
      console.log('💾 Saved', dataToSave.length, 'records to DB');
    }

    // Kiểm tra threshold & tạo alert
    await AlertService.checkThresholds(dataToSave);

    // Kiểm tra auto-control cho các thiết bị
    await this.checkAutoControl(dataToSave);
  }

  async checkAutoControl(sensorData) {
    // Lấy tất cả devices có auto_toggle = true
    const autoDevices = await DeviceModel.getDevicesWithAutoToggle();
    
    if (!autoDevices || autoDevices.length === 0) {
      return;
    }

    // Helper function to determine sensor type from sensor_id
    const getSensorType = (sensorId) => {
      const sensorTypeMap = {
        [process.env.SENSOR_TEMPERATURE_ID]: 'temperature',
        [process.env.SENSOR_HUMIDITY_ID]: 'humidity',
        [process.env.SENSOR_LIGHT_ID]: 'light',
        [process.env.SENSOR_DUST_ID]: 'dust'
      };
      return sensorTypeMap[sensorId] || null;
    };

    for (const device of autoDevices) {
      // Tìm sensor data tương ứng với device
      const matchedData = sensorData.find(data => data.sensor_id === device.sensor_id);
      
      if (!matchedData) {
        continue;
      }

      const { value } = matchedData;
      const { threshold_min, threshold_max } = device;

      // Kiểm tra xem có ngưỡng không
      if (threshold_min === null || threshold_max === null) {
        continue;
      }

      // Logic: Bật đèn nếu giá trị TRONG khoảng an toàn (min < value < max)
      let shouldBeOn = false;
      if (value > threshold_min && value < threshold_max) {
        shouldBeOn = true;
      }

      // Cập nhật trạng thái device nếu cần
      const newValue = shouldBeOn ? 1 : 0;
      
      if (device.value !== newValue) {
        await DeviceModel.updateWithCommandStatus(device.id, {
          value: newValue,
          status: 'success'
        });
        console.log(`🔄 Auto-control: ${device.name} -> ${shouldBeOn ? 'ON' : 'OFF'} (sensor value: ${value}, min: ${threshold_min}, max: ${threshold_max})`);

        // Gửi lệnh MQTT xuống ESP32
        const ledMapping = {
          'temperature': 'led_temp',
          'humidity': 'led_hum',
          'light': 'led_ldr',
          'dust': 'led_dust'
        };

        const sensorType = getSensorType(device.sensor_id);
        const ledKey = sensorType ? ledMapping[sensorType] : null;
        
        if (ledKey) {
          const command = { [ledKey]: shouldBeOn };
          this.publishCommand('abcde1', command);
        }

        // Broadcast status change qua Socket
        SocketService.broadcastDeviceStatus({
          device_id: device.id,
          value: newValue,
          status: 'success',
          auto_controlled: true,
          timestamp: new Date()
        });
      }
    }
  }

  publishCommand(deviceId, command) {
    const topic = `iot/device/${deviceId}/command`;
    const message = JSON.stringify(command);
    
    mqttClient.publish(topic, message, (err) => {
      if (err) {
        console.error('❌ Publish failed:', err);
      } else {
        console.log('📤 Command sent to', deviceId, ':', command);
      }
    });
  }

  // Publish command and track for confirmation
  async publishCommandWithTracking(deviceId, ledKey, value, dbDeviceId, timeout = 10000, actionHistoryId = null) {
    return new Promise((resolve, reject) => {
      const command = { [ledKey]: value === 1 };
      const topic = `iot/device/${deviceId}/command`;
      const message = JSON.stringify(command);
      
      // Create tracking key
      const commandKey = `${dbDeviceId}_${ledKey.replace('led_', '') + '_led'}`;
      
      // Set timeout for command failure
      const timeoutId = setTimeout(async () => {
        console.error(`⏱️ Command timeout for ${ledKey}`);
        this.pendingCommands.delete(commandKey);
        
        // Update action history to failed
        if (actionHistoryId) {
          const ActionHistory = require('../models/actionHistoryModel');
          await ActionHistory.updateStatus(actionHistoryId, 'failed');
        }
        
        // Set status to failed (keep value unchanged)
        await DeviceModel.updateWithCommandStatus(dbDeviceId, {
          status: 'failed'
        });
        
        // Broadcast failure
        const device = await DeviceModel.getById(dbDeviceId);
        SocketService.broadcastDeviceStatus({
          device_id: dbDeviceId,
          value: device.value,
          status: 'failed',
          error: 'Command timeout',
          timestamp: new Date()
        });
        
        reject(new Error('Command timeout'));
      }, timeout);
      
      // Store pending command
      this.pendingCommands.set(commandKey, {
        deviceId: dbDeviceId,
        ledKey,
        value,
        timeout: timeoutId,
        actionHistoryId: actionHistoryId,
        timestamp: new Date()
      });
      
      // Publish command
      mqttClient.publish(topic, message, (err) => {
        if (err) {
          console.error('❌ Publish failed:', err);
          clearTimeout(timeoutId);
          this.pendingCommands.delete(commandKey);
          reject(err);
        } else {
          console.log(`📤 Command sent (tracking): ${ledKey} -> ${value === 1 ? 'ON' : 'OFF'}`);
          resolve();
        }
      });
    });
  }
}

module.exports = new MqttService();