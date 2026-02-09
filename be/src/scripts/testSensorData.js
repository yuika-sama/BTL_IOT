require('dotenv').config();
const mqttClient = require('../config/mqtt');

const testSensorData = () => {
  console.log('🧪 Starting sensor data test...');
  
  // Get sensor IDs from environment
  const sensorIds = {
    temperature: process.env.SENSOR_TEMPERATURE_ID,
    humidity: process.env.SENSOR_HUMIDITY_ID,
    light: process.env.SENSOR_LIGHT_ID,
    dust: process.env.SENSOR_DUST_ID
  };

  // Validate sensor IDs
  for (const [name, id] of Object.entries(sensorIds)) {
    if (!id) {
      console.error(`❌ ${name.toUpperCase()}_ID not found in .env file`);
      process.exit(1);
    }
  }

  console.log('✅ All sensor IDs found');
  console.log('\n📡 Publishing test data every 5 seconds...');
  console.log('Press Ctrl+C to stop\n');

  let count = 0;

  const publishInterval = setInterval(() => {
    count++;
    
    // Generate realistic random values
    const temperature = 22 + (Math.random() - 0.5) * 10; // 17-27°C
    const humidity = 55 + (Math.random() - 0.5) * 20; // 45-65%
    const light = Math.floor(200 + Math.random() * 600); // 200-800 lux
    const dust = 20 + (Math.random() - 0.5) * 30; // 5-35 µg/m³

    const data = [
      {
        sensor_id: sensorIds.temperature,
        value: Math.round(temperature * 10) / 10,
        name: 'temperature'
      },
      {
        sensor_id: sensorIds.humidity,
        value: Math.round(humidity * 10) / 10,
        name: 'humidity'
      },
      {
        sensor_id: sensorIds.light,
        value: light,
        name: 'light'
      },
      {
        sensor_id: sensorIds.dust,
        value: Math.round(dust * 10) / 10,
        name: 'dust'
      }
    ];

    console.log(`\n📊 Publishing batch #${count}:`);
    
    data.forEach(item => {
      const message = {
        sensor_id: item.sensor_id,
        value: item.value,
        timestamp: new Date().toISOString()
      };

      mqttClient.publish(
        process.env.MQTT_TOPIC_SENSOR || 'sensor/data',
        JSON.stringify(message),
        { qos: 1 },
        (err) => {
          if (err) {
            console.error(`❌ Error publishing ${item.name}:`, err);
          } else {
            console.log(`✅ ${item.name}: ${item.value}`);
          }
        }
      );
    });
  }, 5000); // Every 5 seconds

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping test...');
    clearInterval(publishInterval);
    mqttClient.end();
    process.exit(0);
  });
};

// Wait for MQTT connection
mqttClient.on('connect', () => {
  console.log('✅ Connected to MQTT broker');
  testSensorData();
});

mqttClient.on('error', (error) => {
  console.error('❌ MQTT connection error:', error);
  process.exit(1);
});