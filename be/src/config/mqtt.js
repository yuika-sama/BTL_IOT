const mqtt = require('mqtt');

const brokerUrl = `mqtts://${process.env.MQTT_BROKER}:${process.env.MQTT_PORT}`;

const clientId = process.env.MQTT_CLIENT_ID || `be-${process.pid}-${Date.now()}`;

const options = {
  clientId,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  rejectUnauthorized: process.env.MQTT_TLS_REJECT_UNAUTHORIZED === 'true',
  clean: true,
  reconnectPeriod: 1000,
  connectTimeout: 30000,
  keepalive: 60,
  // Last Will Testament - Backend cũng có thể set will nếu cần
  will: {
    topic: 'iot/device/backend/status',
    payload: JSON.stringify({ status: 'offline', timestamp: new Date() }),
    qos: 1,
    retain: true
  }
};

console.log('🔌 Connecting to MQTT:', brokerUrl);

const client = mqtt.connect(brokerUrl, options);

client.on('connect', () => {
  console.log('✅ MQTT Connected!');
  
  // Publish backend online status
  client.publish('iot/device/backend/status', JSON.stringify({ 
    status: 'online', 
    timestamp: new Date() 
  }), { retain: true });
});

client.on('error', (err) => {
  console.error('❌ MQTT Error:', err.message);
});

client.on('offline', () => {
  console.warn('⚠️ MQTT Client offline');
});

client.on('reconnect', () => {
  console.log('🔄 MQTT Reconnecting...');
});

module.exports = client;