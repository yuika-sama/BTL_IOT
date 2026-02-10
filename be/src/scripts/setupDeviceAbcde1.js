require('dotenv').config();
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function setupDeviceAbcde1() {
  try {
    console.log('🚀 Setting up device "abcde1"...\n');

    // Step 1: Check if device exists
    const [existing] = await db.query('SELECT * FROM devices WHERE id = ?', ['abcde1']);
    
    let device;
    if (existing.length > 0) {
      device = existing[0];
      console.log('✅ Device "abcde1" already exists');
    } else {
      // Create device with specific ID (not UUID, just 'abcde1')
      await db.query(
        `INSERT INTO devices (id, name, type, status, is_connected, created_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        ['abcde1', 'ESP32 Main Board', 'ESP32', 1, 1]
      );
      console.log('✅ Created device "abcde1"');
      
      const [newDevice] = await db.query('SELECT * FROM devices WHERE id = ?', ['abcde1']);
      device = newDevice[0];
    }

    // Step 2: Check and create sensors
    const sensorsConfig = [
      { name: 'nhiệt độ', unit: '°C', threshold_min: 15, threshold_max: 35 },
      { name: 'độ ẩm', unit: '%', threshold_min: 30, threshold_max: 80 },
      { name: 'ánh sáng', unit: 'lux', threshold_min: 100, threshold_max: 2400 },
      { name: 'bụi', unit: 'μg/m³', threshold_min: 0, threshold_max: 150 }
    ];

    console.log('\n📡 Setting up sensors...');
    
    for (const config of sensorsConfig) {
      const [existingSensor] = await db.query(
        'SELECT * FROM sensors WHERE device_id = ? AND name = ?',
        [device.id, config.name]
      );

      if (existingSensor.length > 0) {
        console.log(`   ✓ Sensor "${config.name}" already exists`);
      } else {
        await db.query(
          `INSERT INTO sensors (id, device_id, name, unit, threshold_min, threshold_max, created_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [uuidv4(), device.id, config.name, config.unit, config.threshold_min, config.threshold_max]
        );
        console.log(`   ✓ Created sensor "${config.name}"`);
      }
    }

    // Step 3: Show sensor IDs for .env
    console.log('\n📋 Sensor IDs (add to .env):');
    const [sensors] = await db.query(
      'SELECT id, name FROM sensors WHERE device_id = ? ORDER BY name',
      [device.id]
    );
    
    console.log(`\nDevice ID: ${device.id}`);
    
    sensors.forEach(s => {
      const envName = s.name === 'nhiệt độ' ? 'TEMPERATURE' :
                      s.name === 'độ ẩm' ? 'HUMIDITY' :
                      s.name === 'ánh sáng' ? 'LIGHT' :
                      s.name === 'bụi' ? 'DUST' : s.name.toUpperCase();
      console.log(`SENSOR_${envName}_ID=${s.id}`);
    });

    console.log('\n✅ Setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupDeviceAbcde1();
