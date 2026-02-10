require('dotenv').config();
const db = require('../config/db');

async function checkSchema() {
  try {
    const [columns] = await db.query('DESCRIBE devices');
    console.log('📋 Devices table schema:\n');
    columns.forEach(col => {
      console.log(`${col.Field} (${col.Type}) ${col.Key === 'PRI' ? '🔑 PRIMARY' : ''}`);
    });
    
    console.log('\n📊 Current devices:');
    const [rows] = await db.query('SELECT * FROM devices LIMIT 5');
    console.log(JSON.stringify(rows, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
