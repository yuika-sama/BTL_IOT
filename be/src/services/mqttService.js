const mqtt = require('mqtt');
require('dotenv').config();
const { randomUUID } = require('crypto');
const { query } = require('../config/db');
const { syncAutoDevicesAndApplyControl } = require('./autoControlService');

const SENSOR_TYPE_CONDITIONS = {
    temperature: "(LOWER(name) LIKE '%temp%' OR LOWER(name) LIKE '%nhiet%')",
    humidity: "(LOWER(name) LIKE '%hum%' OR LOWER(name) LIKE '%am%')",
    light: "(LOWER(name) LIKE '%light%' OR LOWER(name) LIKE '%anh%' OR LOWER(name) LIKE '%ldr%')",
    gas: "(LOWER(name) LIKE '%gas%' OR LOWER(name) LIKE '%dust%' OR LOWER(name) LIKE '%bui%' OR LOWER(name) LIKE '%khi%')"
};

class MqttService {
    constructor(io) {
        this.io = io;
        this.latestDeviceStatus = {};
        this.pendingStatusWaiters = new Map();
        this.latestSensorThresholdState = new Map();
        const brokerUrl = process.env.MQTT_SERVER || 'mqtt://localhost';
        const brokerPort = Number(process.env.MQTT_PORT || 2204);
        this.mqttClient = mqtt.connect(brokerUrl, {
            port: brokerPort,
            username: process.env.MQTT_USERNAME || '',
            password: process.env.MQTT_PASSWORD || '',
            clean: true,
            reconnectPeriod: 5000
        });

        this.init();
    }

    normalizeText(value = '') {
        return String(value)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    normalizeSensorType(sensorName = '') {
        const name = this.normalizeText(sensorName);

        if (name.includes('temperature') || name.includes('temp') || name.includes('nhiet')) {
            return 'temperature';
        }
        if (name.includes('humidity') || name.includes('hum') || name.includes('am')) {
            return 'humidity';
        }
        if (name.includes('light') || name.includes('ldr') || name.includes('anh')) {
            return 'light';
        }
        if (name.includes('gas') || name.includes('dust') || name.includes('bui')) {
            return 'gas';
        }

        return null;
    }

    extractSensorReadings(payload = {}) {
        const timestamp = payload.timestamp || new Date().toISOString();
        const readings = [];

        if (payload.sensor !== undefined && payload.value !== undefined) {
            const type = this.normalizeSensorType(payload.sensor);
            const value = Number(payload.value);

            if (type && !Number.isNaN(value)) {
                readings.push({ type, sensor: type, value, timestamp });
            }

            return readings;
        }

        Object.entries(payload).forEach(([key, rawValue]) => {
            const type = this.normalizeSensorType(key);
            const value = Number(rawValue);

            if (type && !Number.isNaN(value)) {
                readings.push({ type, sensor: type, value, timestamp });
            }
        });

        return readings;
    }

    async getSensorConfigByType(type) {
        const condition = SENSOR_TYPE_CONDITIONS[type];
        if (!condition) {
            return null;
        }

        const rows = await query(
            `
                SELECT id, device_id, name, unit, threshold_min, threshold_max
                FROM sensors
                WHERE ${condition}
                ORDER BY created_at ASC
                LIMIT 1
            `
        );

        return rows?.[0] || null;
    }

    evaluateThresholdState(value, thresholdMin, thresholdMax) {
        const min = thresholdMin !== null && thresholdMin !== undefined ? Number(thresholdMin) : null;
        const max = thresholdMax !== null && thresholdMax !== undefined ? Number(thresholdMax) : null;

        if (min !== null && !Number.isNaN(min) && value < min) {
            return 'low';
        }

        if (max !== null && !Number.isNaN(max) && value > max) {
            return 'high';
        }

        return 'normal';
    }

    toMySqlDateTime(input) {
        const parsedDate = input ? new Date(input) : new Date();
        const date = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
        return date.toISOString().slice(0, 19).replace('T', ' ');
    }

    async insertSensorData(sensorId, value, timestamp) {
        const createdAt = this.toMySqlDateTime(timestamp);

        await query(
            `
                INSERT INTO data_sensors (id, sensor_id, value, created_at)
                VALUES (?, ?, ?, ?)
            `,
            [randomUUID(), sensorId, value, createdAt]
        );
    }

    async insertAlert({ sensorId, deviceId = null, title, description, severity = 'warning' }) {
        await query(
            `
                INSERT INTO alerts (id, sensor_id, device_id, title, description, severity, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `,
            [randomUUID(), sensorId, deviceId, title, description, severity]
        );

        this.io.emit('alert_update', {
            sensor_id: sensorId,
            device_id: deviceId,
            title,
            description,
            severity,
            timestamp: new Date().toISOString()
        });
    }

    buildAlertPayload(sensor, value, thresholdState, previousState) {
        const sensorName = sensor?.name || 'Sensor';
        const unit = sensor?.unit || '';

        if (thresholdState === 'normal' && previousState && previousState !== 'normal') {
            return {
                severity: 'medium',
                title: `${sensorName} đã trở lại bình thường`,
                description: `${sensorName} hiện tại = ${value}${unit}. Giá trị đã nằm trong ngưỡng an toàn.`
            };
        }

        if (thresholdState === 'high') {
            return {
                severity: 'high',
                title: `${sensorName} vượt ngưỡng trên`,
                description: `${sensorName} = ${value}${unit}, vượt ngưỡng tối đa ${sensor.threshold_max}${unit}.`
            };
        }

        if (thresholdState === 'low') {
            return {
                severity: 'low',
                title: `${sensorName} thấp hơn ngưỡng dưới`,
                description: `${sensorName} = ${value}${unit}, thấp hơn ngưỡng tối thiểu ${sensor.threshold_min}${unit}.`
            };
        }

        return null;
    }

    async persistSensorAndCreateAlert(reading) {
        const sensor = await this.getSensorConfigByType(reading.type);
        if (!sensor) {
            return;
        }

        await this.insertSensorData(sensor.id, reading.value, reading.timestamp);

        const thresholdState = this.evaluateThresholdState(reading.value, sensor.threshold_min, sensor.threshold_max);
        const previousState = this.latestSensorThresholdState.get(sensor.id);
        this.latestSensorThresholdState.set(sensor.id, thresholdState);

        const alertPayload = this.buildAlertPayload(sensor, reading.value, thresholdState, previousState);
        if (!alertPayload) {
            return;
        }

        if (previousState === thresholdState) {
            return;
        }

        await this.insertAlert({
            sensorId: sensor.id,
            deviceId: sensor.device_id || null,
            title: alertPayload.title,
            description: alertPayload.description,
            severity: alertPayload.severity
        });
    }

    emitSensorUpdate(readings = []) {
        readings.forEach((reading) => {
            this.io.emit('sensor_update', reading);
        });
    }

    async handleSensorData(payload = {}) {
        const readings = this.extractSensorReadings(payload);
        if (!readings.length) {
            return;
        }

        for (const reading of readings) {
            await this.persistSensorAndCreateAlert(reading);
        }

        this.emitSensorUpdate(readings);
    }

    init() {
        this.mqttClient.on('connect', () => {
            // Đăng ký các topic mà ESP32 sẽ gửi lên
            this.mqttClient.subscribe(['sensor/data', 'device/status', 'device/sync'], (err) => {
                if (!err) console.log('📡 [MQTT] Subscribed to all topics');
            });

            syncAutoDevicesAndApplyControl({
                mqttService: this,
                trigger: 'mqtt-connect'
            }).catch((error) => {
                console.error('❌ [AUTO] Sync after MQTT connect failed:', error.message);
            });
        });

        this.mqttClient.on('disconnect', () => {
            console.log('⚠️ [MQTT] Disconnected from Broker');
        });

        this.mqttClient.on('message', (topic, message) => {
            try {
                const payload = JSON.parse(message.toString());
                
                switch (topic) {
                    case 'sensor/data':
                        // Payload ví dụ: { sensor: "temperature", value: 25.0 }
                        // hoặc batch: { temperature: 25.0, humidity: 70 }
                        this.handleSensorData(payload)
                            .then(() => {
                                return syncAutoDevicesAndApplyControl({
                                    mqttService: this,
                                    trigger: 'sensor-data'
                                });
                            })
                            .catch((error) => {
                                console.error('❌ [AUTO] Handle sensor data failed:', error.message);
                            });
                        break;

                    case 'device/status':
                        // Gửi trạng thái LED (ON/OFF)
                        // Payload: { temp_led: "ON", hum_led: "OFF", ... }
                        this.updateDeviceStatus(payload);
                        this.io.emit('device_status_update', payload);
                        break;

                    case 'device/sync':
                        console.log(`🔄 [SYNC] Hardware ${payload.clientId} requested sync.`);
                        // Tạm thời log lại, sau này sẽ query DB ở đây  
                        break;
                }
            } catch (error) {
                // Nếu hardware gửi chuỗi text không phải JSON (ví dụ lệnh lỗi)
                console.log(`📩 [MQTT Raw] Topic: ${topic} - Msg: ${message.toString()}`);
            }
        });
    }

    normalizeStateValue(value) {
        if (typeof value === 'number') {
            return value === 1 ? 1 : 0;
        }

        const normalized = String(value || '').trim().toUpperCase();
        return normalized === 'ON' || normalized === '1' || normalized === 'TRUE' ? 1 : 0;
    }

    getStateKeyByDeviceName(deviceName = '') {
        const name = this.normalizeText(deviceName);

        if (name.includes('dev_temp_led') || name.includes('temp') || name.includes('nhiet do') || name.includes('nhiet')) {
            return 'temp_led';
        }
        if (name.includes('dev_hum_led') || name.includes('hum') || name.includes('do am') || name.includes('am')) {
            return 'hum_led';
        }
        if (name.includes('dev_ldr_led') || name.includes('ldr') || name.includes('light') || name.includes('anh sang') || name.includes('anh')) {
            return 'ldr_led';
        }
        if (name.includes('dev_gas_led') || name.includes('dev_dust_led') || name.includes('dust') || name.includes('gas') || name.includes('bui')) {
            return 'gas_led';
        }

        return null;
    }

    updateDeviceStatus(payload = {}) {
        Object.keys(payload).forEach((key) => {
            const lowerKey = String(key).toLowerCase();
            if (!lowerKey.endsWith('_led')) {
                return;
            }

            const state = this.normalizeStateValue(payload[key]);
            this.latestDeviceStatus[lowerKey] = state;

            const waiters = this.pendingStatusWaiters.get(lowerKey);
            if (!waiters || !waiters.length) {
                return;
            }

            const unresolvedWaiters = [];
            waiters.forEach((waiter) => {
                if (waiter.targetValue === state) {
                    clearTimeout(waiter.timeoutId);
                    waiter.resolve({ key: lowerKey, value: state });
                } else {
                    unresolvedWaiters.push(waiter);
                }
            });

            if (unresolvedWaiters.length) {
                this.pendingStatusWaiters.set(lowerKey, unresolvedWaiters);
            } else {
                this.pendingStatusWaiters.delete(lowerKey);
            }
        });
    }

    isConnected() {
        return Boolean(this.mqttClient?.connected);
    }

    publishControl(command) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected()) {
                reject(new Error('MQTT is not connected'));
                return;
            }

            this.mqttClient.publish('device/control', String(command).toUpperCase(), (error) => {
                if (error) {
                    reject(error);
                    return;
                }

                console.log(`📤 [MQTT] Published command: ${command}`);
                resolve();
            });
        });
    }

    waitForDeviceState(deviceName, targetValue, timeoutMs = 5000) {
        return new Promise((resolve, reject) => {
            const stateKey = this.getStateKeyByDeviceName(deviceName);
            if (!stateKey) {
                reject(new Error('Cannot map device name to hardware status key'));
                return;
            }

            const normalizedTarget = this.normalizeStateValue(targetValue);
            if (this.latestDeviceStatus[stateKey] === normalizedTarget) {
                resolve({ key: stateKey, value: normalizedTarget, immediate: true });
                return;
            }

            const timeoutId = setTimeout(() => {
                const waiters = this.pendingStatusWaiters.get(stateKey) || [];
                const remaining = waiters.filter((waiter) => waiter.timeoutId !== timeoutId);
                if (remaining.length) {
                    this.pendingStatusWaiters.set(stateKey, remaining);
                } else {
                    this.pendingStatusWaiters.delete(stateKey);
                }
                reject(new Error('Timeout waiting for hardware confirmation'));
            }, timeoutMs);

            const waiter = {
                targetValue: normalizedTarget,
                timeoutId,
                resolve,
                reject
            };

            const currentWaiters = this.pendingStatusWaiters.get(stateKey) || [];
            currentWaiters.push(waiter);
            this.pendingStatusWaiters.set(stateKey, currentWaiters);
        });
    }

    async sendCommandAndWait(deviceName, command, targetValue, timeoutMs = 5000) {
        if (!this.isConnected()) {
            throw new Error('MQTT is not connected');
        }

        const waitPromise = this.waitForDeviceState(deviceName, targetValue, timeoutMs);
        await this.publishControl(command);
        return waitPromise;
    }
}

module.exports = MqttService;