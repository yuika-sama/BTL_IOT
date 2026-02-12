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
  keepalive: 60
};

console.log('🔌 Connecting to MQTT:', brokerUrl);

const client = mqtt.connect(brokerUrl, options);

client.on('connect', () => {
  console.log('✅ MQTT Connected!');
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