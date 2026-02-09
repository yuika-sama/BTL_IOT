require('dotenv').config();
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const setupSensors = async () => {
  try {
    console.log('🚀 Starting sensor setup...');

    // Step 1: Create a default device if not exists
    const deviceId = uuidv4();
    const deviceName = 'ESP32 Main Board';
    const deviceType = 'ESP32';

    // Check if device already exists
    const [existingDevices] = await db.query(
      'SELECT * FROM devices WHERE name = ? AND type = ?',
      [deviceName, deviceType]
    );

    let device;
    if (existingDevices.length > 0) {
      device = existingDevices[0];
      console.log('✅ Device already exists:', device.name);
    } else {
      // Create new device
      await db.query(
        'INSERT INTO devices (id, name, type, status, is_connected) VALUES (?, ?, ?, ?, ?)',
        [deviceId, deviceName, deviceType, false, false]
      );
      const [newDevice] = await db.query('SELECT * FROM devices WHERE id = ?', [deviceId]);
      device = newDevice[0];
      console.log('✅ Created new device:', device.name);
    }

    // Step 2: Create 4 sensors
    const sensors = [
      {
        id: uuidv4(),
        device_id: device.id,
        name: 'Nhiệt độ',
        unit: '°C',
        threshold_min: 15,
        threshold_max: 35,
        description: 'Cảm biến nhiệt độ'
      },
      {
        id: uuidv4(),
        device_id: device.id,
        name: 'độ ẩm',
        unit: '%',
        threshold_min: 30,
        threshold_max: 80,
        description: 'Cảm biến độ ẩm'
      },
      {
        id: uuidv4(),
        device_id: device.id,
        name: 'ánh sáng',
        unit: 'lux',
        threshold_min: 100,
        threshold_max: 2400,
        description: 'Cảm biến ánh sáng'
      },
      {
        id: uuidv4(),
        device_id: device.id,
        name: 'bụi',
        unit: 'mg/m³',
        threshold_min: 0,
        threshold_max: 50,
        description: 'Cảm biến bụi'
      }
    ];

    console.log('\n📡 Creating sensors...');
    const createdSensors = [];

    for (const sensor of sensors) {
      // Check if sensor already exists
      const [existing] = await db.query(
        'SELECT * FROM sensors WHERE device_id = ? AND name = ?',
        [sensor.device_id, sensor.name]
      );

      if (existing.length > 0) {
        console.log(`⚠️  Sensor "${sensor.name}" already exists, skipping...`);
        createdSensors.push(existing[0]);
      } else {
        await db.query(
          'INSERT INTO sensors (id, device_id, name, unit, threshold_min, threshold_max) VALUES (?, ?, ?, ?, ?, ?)',
          [sensor.id, sensor.device_id, sensor.name, sensor.unit, sensor.threshold_min, sensor.threshold_max]
        );
        const [newSensor] = await db.query('SELECT * FROM sensors WHERE id = ?', [sensor.id]);
        createdSensors.push(newSensor[0]);
        console.log(`✅ Created sensor: ${sensor.description} (${sensor.name})`);
      }
    }

    // Step 3: Generate .env configuration
    console.log('\n📝 Environment Variables Configuration:');
    console.log('=====================================');
    console.log('Add these to your .env file:');
    console.log('');
    
    const temperatureSensor = createdSensors.find(s => s.name === 'temperature');
    const humiditySensor = createdSensors.find(s => s.name === 'humidity');
    const lightSensor = createdSensors.find(s => s.name === 'light');
    const dustSensor = createdSensors.find(s => s.name === 'dust');

    console.log(`SENSOR_TEMPERATURE_ID=${temperatureSensor?.id || ''}`);
    console.log(`SENSOR_HUMIDITY_ID=${humiditySensor?.id || ''}`);
    console.log(`SENSOR_LIGHT_ID=${lightSensor?.id || ''}`);
    console.log(`SENSOR_DUST_ID=${dustSensor?.id || ''}`);
    console.log('');

    // Step 4: Display summary
    console.log('\n📊 Setup Summary:');
    console.log('=====================================');
    console.log(`Device: ${device.name} (${device.id})`);
    console.log('\nSensors:');
    createdSensors.forEach((sensor, index) => {
      console.log(`${index + 1}. ${sensor.name.toUpperCase()}`);
      console.log(`   - ID: ${sensor.id}`);
      console.log(`   - Unit: ${sensor.unit}`);
      console.log(`   - Threshold: ${sensor.threshold_min} - ${sensor.threshold_max} ${sensor.unit}`);
    });

    console.log('\n✅ Sensor setup completed successfully!');
    console.log('\n⚠️  IMPORTANT: Copy the environment variables above to your .env file');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up sensors:', error);
    process.exit(1);
  }
};

// Run setup
setupSensors();