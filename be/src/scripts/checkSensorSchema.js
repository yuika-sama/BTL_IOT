require('dotenv').config();
const db = require('../config/db');

async function checkSensorSchema() {
  try {
    const [columns] = await db.query('DESCRIBE sensors');
    console.log('📋 Sensors table schema:\n');
    columns.forEach(col => {
      console.log(`${col.Field} (${col.Type}) ${col.Key ? '🔑 ' + col.Key : ''}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSensorSchema();
