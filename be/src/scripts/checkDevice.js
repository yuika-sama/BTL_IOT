require('dotenv').config();
const Device = require('../models/deviceModel');
const db = require('../config/db');

async function checkDevice() {
  try {
    console.log('Checking device "abcde1"...\n');
    
    const device = await Device.getById('abcde1');
    
    if (device) {
      console.log('✅ Device found:');
      console.log(JSON.stringify(device, null, 2));
    } else {
      console.log('❌ Device NOT found in database');
      console.log('\nChecking all devices...');
      
      const [rows] = await db.query('SELECT * FROM devices');
      console.log(`\nTotal devices: ${rows.length}`);
      rows.forEach(d => {
        console.log(`- ID: ${d.device_id}, Name: ${d.name}, Status: ${d.status}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDevice();
