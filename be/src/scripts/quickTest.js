require('dotenv').config();
const DataSensorModel = require('../models/dataSensorModel');

async function test() {
    try {
        console.log('Testing DataSensorModel.getHistory...');
        const result = await DataSensorModel.getHistory({
            sensorType: 'temperature',
            limit: 5
        });
        console.log('✅ Success:', result.length, 'records');
        console.log('Sample:', result[0]);
        
        console.log('\nTesting DataSensorModel.getLatestBySensor...');
        const sensorId = process.env.SENSOR_TEMPERATURE_ID;
        if (sensorId) {
            const latest = await DataSensorModel.getLatestBySensor(sensorId);
            console.log('✅ Success:', latest);
        } else {
            console.log('⚠️  SENSOR_TEMPERATURE_ID not set');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

test();
