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