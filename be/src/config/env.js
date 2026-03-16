const env = require('dotenv');
env.config();

module.exports = {
    MQTT_BROKER_URL: process.env.MQTT_BROKER_URL || 'mqtt://localhost',
    MQTT_USERNAME: process.env.MQTT_USERNAME || 'your_username',
    MQTT_PASSWORD: process.env.MQTT_PASSWORD || 'your_password',
    MQTT_PORT: process.env.MQTT_PORT || 8883
};