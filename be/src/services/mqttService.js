const mqttClient = require('../config/mqtt');
const DataSensorModel = require('../models/dataSensorModel');
const AlertService = require('./alertService');
const SocketService = require('./socketService');

class MqttService {
  constructor() {
    this.setupSubscriptions();
  }

  setupSubscriptions() {
    mqttClient.on('connect', () => {
      // Subscribe topic nhận data từ ESP32
      const topic = process.env.MQTT_TOPIC_DEVICE_DATA;
      mqttClient.subscribe(topic, (err) => {
        if (err) {
          console.error('❌ Subscribe failed:', err);
        } else {
          console.log('✅ Subscribed to:', topic);
        }
      });
    });

    mqttClient.on('message', async (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        console.log('📩 Received:', payload);

        await this.handleDeviceData(payload);
      } catch (error) {
        console.error('❌ Parse error:', error.message);
      }
    });
  }

  async handleDeviceData(payload) {
    const { device_id, sensors, leds } = payload;

    if (!sensors) {
      console.warn('⚠️ No sensors data');
      return;
    }

    // Map sensor types sang sensor_id từ env
    const sensorMap = {
      temperature: process.env.SENSOR_TEMPERATURE_ID,
      humidity: process.env.SENSOR_HUMIDITY_ID,
      light_raw: process.env.SENSOR_LIGHT_ID,
      dust_ugm3: process.env.SENSOR_DUST_ID,
    };

    const dataToSave = [];

    for (const [type, value] of Object.entries(sensors)) {
      const sensor_id = sensorMap[type];
      if (sensor_id && value !== null && value !== undefined) {
        dataToSave.push({
          sensor_id,
          value: parseFloat(value),
          timestamp: new Date(),
        });
      }
    }

    // Lưu vào DB
    if (dataToSave.length > 0) {
      for (const data of dataToSave) {
        await DataSensorModel.create(data);
      }
      console.log('💾 Saved', dataToSave.length, 'records');
    }

    // Broadcast qua Socket
    SocketService.broadcastSensorData({
      device_id,
      sensors,
      leds,
      timestamp: new Date(),
    });

    // Kiểm tra threshold & tạo alert
    await AlertService.checkThresholds(dataToSave);
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
}

module.exports = new MqttService();