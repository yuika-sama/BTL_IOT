/**
 * Centralized Configuration
 * All environment variables and config in one place
 */

require('dotenv').config();

module.exports = {
  app: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CLIENT_URL || 'http://localhost:5173'
  },
  
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    name: process.env.DB_NAME || 'iot_db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  },
  
  mqtt: {
    broker: process.env.MQTT_BROKER || 'mqtt://localhost:1883',
    username: process.env.MQTT_USERNAME || '',
    password: process.env.MQTT_PASSWORD || '',
    topics: {
      sensorData: process.env.MQTT_TOPIC_SENSOR || 'home/sensor',
      control: process.env.MQTT_TOPIC_CONTROL || 'home/control',
      status: process.env.MQTT_TOPIC_STATUS || 'home/status'
    }
  },
  
  pagination: {
    defaultLimit: 10,
    maxLimit: 100
  },
  
  sensor: {
    dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS) || 30,
    aggregateIntervals: ['minute', 'hour', 'day', 'week', 'month'],
    types: ['temperature', 'humidity', 'light', 'dust']
  },
  
  alert: {
    severityLevels: ['low', 'medium', 'high', 'critical'],
    statuses: ['active', 'acknowledged', 'resolved']
  },
  
  // Device IDs from environment
  devices: {
    temperature: process.env.DEVICE_TEMPERATURE_ID,
    humidity: process.env.DEVICE_HUMIDITY_ID,
    light: process.env.DEVICE_LIGHT_ID,
    dust: process.env.DEVICE_DUST_ID
  },
  
  // Sensor IDs from environment
  sensors: {
    temperature: process.env.SENSOR_TEMPERATURE_ID,
    humidity: process.env.SENSOR_HUMIDITY_ID,
    light: process.env.SENSOR_LIGHT_ID,
    dust: process.env.SENSOR_DUST_ID
  }
};
