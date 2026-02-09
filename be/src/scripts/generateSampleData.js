require('dotenv').config();
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const generateSampleData = async () => {
  try {
    console.log('🚀 Starting sample data generation...');

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
        throw new Error(`${name.toUpperCase()}_ID not found in .env file. Please run setup first.`);
      }
    }

    console.log('✅ All sensor IDs found in .env');

    // Generate data for the last 24 hours
    const now = new Date();
    const dataCount = 100; // Generate 100 records per sensor
    const intervalMinutes = (24 * 60) / dataCount; // Distribute over 24 hours

    console.log(`\n📊 Generating ${dataCount} records per sensor...`);

    for (const [sensorName, sensorId] of Object.entries(sensorIds)) {
      console.log(`\nGenerating data for ${sensorName}...`);
      
      for (let i = 0; i < dataCount; i++) {
        const id = uuidv4();
        
        // Calculate timestamp (going backwards from now)
        const timestamp = new Date(now.getTime() - (i * intervalMinutes * 60 * 1000));
        
        // Generate realistic random values based on sensor type
        let value;
        switch (sensorName) {
          case 'temperature':
            // Temperature: 18-32°C with some variation
            value = 22 + Math.sin(i / 10) * 5 + (Math.random() - 0.5) * 4;
            value = Math.round(value * 10) / 10;
            break;
          case 'humidity':
            // Humidity: 40-70% with some variation
            value = 55 + Math.sin(i / 8) * 10 + (Math.random() - 0.5) * 8;
            value = Math.round(value * 10) / 10;
            break;
          case 'light':
            // Light: 100-800 lux with day/night cycle
            const hour = timestamp.getHours();
            const isDaytime = hour >= 6 && hour <= 18;
            value = isDaytime 
              ? 400 + Math.sin(i / 5) * 200 + Math.random() * 100
              : 50 + Math.random() * 50;
            value = Math.round(value);
            break;
          case 'dust':
            // Dust: 10-40 µg/m³ with random spikes
            value = 20 + Math.sin(i / 12) * 10 + (Math.random() - 0.5) * 8;
            // Occasional spikes
            if (Math.random() > 0.9) {
              value += Math.random() * 20;
            }
            value = Math.round(value * 10) / 10;
            break;
        }

        // Insert data
        await db.query(
          'INSERT INTO data_sensors (id, sensor_id, value, created_at) VALUES (?, ?, ?, ?)',
          [id, sensorId, value, timestamp]
        );
      }
      
      console.log(`✅ Generated ${dataCount} records for ${sensorName}`);
    }

    // Generate some sample alerts
    console.log('\n⚠️  Generating sample alerts...');
    
    const alertCount = 10;
    const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    
    for (let i = 0; i < alertCount; i++) {
      const sensorNames = Object.keys(sensorIds);
      const randomSensorName = sensorNames[Math.floor(Math.random() * sensorNames.length)];
      const sensorId = sensorIds[randomSensorName];
      
      // Get sensor info
      const [sensors] = await db.query('SELECT * FROM sensors WHERE id = ?', [sensorId]);
      const sensor = sensors[0];
      
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const timestamp = new Date(now.getTime() - (Math.random() * 24 * 60 * 60 * 1000));
      
      const alertId = uuidv4();
      await db.query(
        'INSERT INTO alerts (id, sensor_id, device_id, title, description, severity, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          alertId,
          sensorId,
          sensor.device_id,
          `${randomSensorName.toUpperCase()} Alert`,
          `Sample alert for ${randomSensorName} sensor`,
          severity,
          timestamp
        ]
      );
    }
    
    console.log(`✅ Generated ${alertCount} sample alerts`);

    // Generate some action history
    console.log('\n📝 Generating sample action history...');
    
    const actionCount = 20;
    const commands = ['ON', 'OFF'];
    const statuses = ['success', 'failed', 'waiting'];
    const executors = ['user', 'system', 'automation'];
    
    // Get device ID
    const [sensors] = await db.query(
      'SELECT device_id FROM sensors WHERE id = ? LIMIT 1',
      [sensorIds.temperature]
    );
    const deviceId = sensors[0].device_id;
    
    for (let i = 0; i < actionCount; i++) {
      const actionId = uuidv4();
      const command = commands[Math.floor(Math.random() * commands.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const executor = executors[Math.floor(Math.random() * executors.length)];
      const timestamp = new Date(now.getTime() - (Math.random() * 24 * 60 * 60 * 1000));
      
      await db.query(
        'INSERT INTO action_history (id, device_id, command, executor, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [actionId, deviceId, command, executor, status, timestamp]
      );
    }
    
    console.log(`✅ Generated ${actionCount} action history records`);

    console.log('\n✅ Sample data generation completed!');
    console.log('\n📊 Summary:');
    console.log(`- Sensor data: ${dataCount * 4} records (${dataCount} per sensor)`);
    console.log(`- Alerts: ${alertCount} records`);
    console.log(`- Action history: ${actionCount} records`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating sample data:', error);
    process.exit(1);
  }
};

// Run generation
generateSampleData();