const mqttClient = require('../config/mqtt');
const socketService = require('./socketService');
const {v4: uuidv4} = require('uuid');
const db = require('../config/database');
const { time } = require('console');
const { subscribe } = require('diagnostics_channel');
require('dotenv').config();

const initialize = () => {
    mqttClient.subscribe(process.env.MQTT_TOPIC_SENSOR || 'sensor/data', (err) => {
        if (err) {
            console.error('Failed to subscribe to topic:', err);
        } else {
            console.log('Subscribed to MQTT topic for sensor data');
        }
    });

    mqttClient.subscribe(process.env.MQTT_TOPIC_DEVICE || 'device/control', (err) => {
        if (err) {
            console.error('Failed to subscribe to topic:', err);
        } else {
            console.log('Subscribed to MQTT topic for device control');
        }
    })

    mqttClient.on('message', async (topic, message) => {
        try {
            const payload = JSON.parse(message.toString());
            if (topic === (process.env.MQTT_TOPIC_SENSOR || 'sensor/data')) {
                await handleSensorData(payload);
            } else if (topic === (process.env.MQTT_TOPIC_DEVICE || 'device/control')) {
                await handleDeviceControl(payload);
            }
        } catch (err) {
            console.error('Error processing MQTT message:', err);
        }
    });

    console.log('MQTT service initialized');
}

const handleSensorData = async (data) => {
    try {
        const {sensor_id, value} = data;

        if (!sensor_id || value === undefined) {
            throw new Error('Invalid sensor data payload');
            return;
        }

        const dataId = uuidv4();
        await db.query(
            `INSERT INTO sensor_data (id, sensor_id, value) 
            VALUES (?, ?, ?)`,
            [dataId, sensor_id, value]
        );
        console.log('Sensor data saved:', data);

        socketService.broadcast('sensor_data', {sensor_id, value, data_id: dataId});
        socketService.emitToSensor(sensor_id, 'sensor_data_update', {sensor_id, value, data_id: dataId});
        
        await checkThreshold(sensor_id, value)
    } catch (err) {
        console.error('Error handling sensor data:', err);
    }
}

const checkThreshold = async (sensor_id, value) => {
    try {
        const [sensors] = await db.query(
            'SELECT * FROM sensors WHERE id = ?',
            [sensor_id]
        )

        if (sensors.length === 0) {
            console.warn('Sensor not found for threshold check:', sensor_id);
            return;
        }

        const sensor = sensors[0]
        const {threshold_min, threshold_max, device_id, name, unit} = sensor;

        if (value < threshold_min || value > threshold_max){
            const severity = value < threshold_min ? 'low' : 'high';
            const alertId = uuidv4();

            await db.query(
                `INSERT INTO alerts (id, sensor_id, device_id, title, description, severity) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    alertId,
                    sensor_id,
                    device_id,
                    `Threshold Breach on ${name}`,
                    `Sensor value ${value} ${unit} breached threshold (${threshold_min}-${threshold_max} ${unit})`,
                    severity
                ]
            );

            console.log('Alert created for threshold breach:', alertId);

            const alertData = {
                id: alertId,
                sensor_id,
                device_id,
                title: `Threshold Breach on ${name}`,
                description: `Sensor value ${value} ${unit} breached threshold (${threshold_min}-${threshold_max} ${unit})`,
                severity
            }

            socketService.broadcast('alert', alertData);
            socketService.emitToDevice(device_id, 'device_alert', alertData);
            socketService.emitToSensor(sensor_id, 'sensor_alert', alertData);
        }

    } catch (err) {
        console.error('Error checking threshold for sensor:', err);
    }
}

const handleDeviceStatus = async (data) => {
    try {
        const {device_id, status, is_connected} = data;

        if (!device_id) {
            throw new Error('Invalid device control payload');
            return;
        }

        const updates = []
        const values = []

        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }

        if (is_connected !== undefined) {
            updates.push('is_connected = ?');
            values.push(is_connected);
        }

        if (updates.length === 0) {
            throw new Error('No valid fields to update for device control');
            return;
        }
        values.push(device_id);

        await db.query(
            `UPDATE devices SET ` + updates.join(', ') + ` WHERE id = ?`,
            values
        );
        console.log('Device status updated:', data);

        socketService.broadcast('device_status', {device_id, status, is_connected});
        socketService.emitToDevice(device_id, 'device_status_update', {device_id, status, is_connected});
    } catch (err) {
        console.error('Error handling device control:', err);
    }
}

const publish = (topic, message) => {
    return new Promise((resolve, reject) => {
        mqttClient.publish(topic, JSON.stringify(message), {qos: 1}, (err) => {
            if (err) {
                console.error('Failed to publish MQTT message:', err);
                reject(err);
            } else {
                console.log('Published MQTT message to topic', topic, ':', message);
                resolve();
            }
        });
    });
}

const publishDeviceCommand = async (deviceId, command) => {
    const topic = process.env.MQTT_TOPIC_DEVICE || 'device/control';
    const message = {
        device_id: deviceId,
        command: command,
        timestamp: new Date().toISOString()
    };
    await publish(topic, message);
}

const publishSensorData = async (sensorId, value) => {
    const topic = process.env.MQTT_TOPIC_SENSOR || 'sensor/data';
    const message = {
        sensor_id: sensorId,
        value: value,
        timestamp: new Date().toISOString()
    };
    await publish(topic, message);
}

const subscribe = (topic) => {
    return new Promise ((resolve, reject) => {
        mqttClient.subscribe(topic, (err) => {
            if (err) {
                console.error('Failed to subscribe to topic:', err);
                reject(err);
            } else {
                console.log('Subscribed to MQTT topic:', topic);
                resolve();
            }
        });
    });
}

const unsubscribe = (topic) => {
    return new Promise ((resolve, reject) => {
        mqttClient.unsubscribe(topic, (err) => {
            if (err) {
                console.error('Failed to unsubscribe from topic:', err);
                reject(err);
            }
            else {
                console.log('Unsubscribed from MQTT topic:', topic);
                resolve();
            }
        });
    });
}

const getStatus = () => {
    return {
        connected: mqttClient.connected,
        reconnecting: mqttClient.reconnecting,
    }
}

module.exports = { 
    initialize, 
    publish,
    publishDeviceCommand,
    publishSensorData,
    subscribe,
    unsubscribe,
    getStatus,
    handleSensorData,
    handleDeviceStatus,
    checkThreshold
};