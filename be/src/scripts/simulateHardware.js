/**
 * Script giả lập ESP32 gửi data qua MQTT
 * Flow: Script này → MQTT → Backend → Socket.IO → Frontend Dashboard
 */

const mqtt = require('mqtt');
require('dotenv').config();

const brokerUrl = `mqtts://${process.env.MQTT_BROKER}:${process.env.MQTT_PORT}`;
const options = {
  clientId: 'hardware_simulator_' + Math.random().toString(16).substring(2, 8),
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  rejectUnauthorized: process.env.MQTT_TLS_REJECT_UNAUTHORIZED !== 'false',
  clean: true,
  reconnectPeriod: 1000,
};

console.log('🔌 Connecting to MQTT Broker:', process.env.MQTT_BROKER);
const client = mqtt.connect(brokerUrl, options);

let intervalId = null;

client.on('connect', () => {
  console.log('✅ Connected to MQTT Broker');
  console.log('📡 Client ID:', options.clientId);
  console.log('📤 Publishing to:', process.env.MQTT_TOPIC_DEVICE_DATA);
  console.log('⏱️  Sending data every 3 seconds...\n');

  // Gửi data mỗi 3 giây
  intervalId = setInterval(() => {
    sendSensorData();
  }, 3000);

  // Gửi data ngay lập tức
  sendSensorData();
});

client.on('error', (error) => {
  console.error('❌ MQTT Error:', error.message);
});

client.on('close', () => {
  console.log('🔌 MQTT Connection closed');
});

client.on('reconnect', () => {
  console.log('🔄 Reconnecting to MQTT...');
});

function sendSensorData() {
  const data = {
    device_id: 'abcde1',
    sensors: {
      temperature: (20 + Math.random() * 10).toFixed(1),      // 20-30°C
      humidity: (40 + Math.random() * 40).toFixed(1),         // 40-80%
      light_raw: Math.floor(Math.random() * 700),             // 0-700 lux
      dust_ugm3: Math.floor(Math.random() * 100),             // 0-100 PM2.5
    },
    leds: {
      led1: Math.random() > 0.5 ? 1 : 0,
      led2: Math.random() > 0.5 ? 1 : 0,
    },
    timestamp: new Date().toISOString()
  };

  const message = JSON.stringify(data);
  
  client.publish(process.env.MQTT_TOPIC_DEVICE_DATA, message, { qos: 1 }, (error) => {
    if (error) {
      console.error('❌ Publish failed:', error);
    } else {
      console.log('📤 Published:', {
        temp: data.sensors.temperature + '°C',
        humi: data.sensors.humidity + '%',
        light: data.sensors.light_raw + ' lux',
        dust: data.sensors.dust_ugm3 + ' PM2.5'
      });
    }
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping hardware simulator...');
  
  if (intervalId) {
    clearInterval(intervalId);
  }
  
  client.end(false, () => {
    console.log('✅ MQTT client disconnected');
    process.exit(0);
  });
});

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});
