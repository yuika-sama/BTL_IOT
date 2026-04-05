const mqtt = require('mqtt');
require('dotenv').config();
const { randomUUID } = require('crypto');
const { query } = require('../config/db');

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
        this.lastHardwareActivityAt = 0;
        this.isSyncInProgress = false;
        this.pendingSyncRequested = false;
        this.hardwareHeartbeatTimeoutMs = Number(process.env.HARDWARE_HEARTBEAT_TIMEOUT_MS || 15000);
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
                SELECT id
                FROM sensors
                WHERE ${condition}
                ORDER BY created_at ASC
                LIMIT 1
            `
        );

        return rows?.[0] || null;
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

    async persistSensorReading(reading) {
        const sensor = await this.getSensorConfigByType(reading.type);
        if (!sensor) {
            return;
        }

        await this.insertSensorData(sensor.id, reading.value, reading.timestamp);
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
            await this.persistSensorReading(reading);
        }

        this.emitSensorUpdate(readings);
    }

    markHardwareActivity() {
        const wasConnected = this.isHardwareConnected();
        this.lastHardwareActivityAt = Date.now();

        if (!wasConnected) {
            this.requestDeviceStateSync('hardware-activity');
        }
    }

    isHardwareConnected() {
        if (!this.isConnected()) {
            return false;
        }

        if (!this.lastHardwareActivityAt) {
            return false;
        }

        return Date.now() - this.lastHardwareActivityAt <= this.hardwareHeartbeatTimeoutMs;
    }

    init() {
        this.mqttClient.on('connect', () => {
            // Đăng ký các topic mà ESP32 sẽ gửi lên
            this.mqttClient.subscribe(['sensor/data', 'device/status', 'device/sync'], (err) => {
                if (!err) console.log('📡 [MQTT] Subscribed to all topics');
            });

            this.requestDeviceStateSync('mqtt-connect');
        });

        this.mqttClient.on('disconnect', () => {
            console.log('⚠️ [MQTT] Disconnected from Broker');
            this.lastHardwareActivityAt = 0;
        });

        this.mqttClient.on('message', (topic, message) => {
            try {
                const payload = JSON.parse(message.toString());

                if (topic === 'sensor/data' || topic === 'device/status') {
                    this.markHardwareActivity();
                }
                
                switch (topic) {
                    case 'sensor/data':
                        // Payload ví dụ: { sensor: "temperature", value: 25.0 }
                        // hoặc batch: { temperature: 25.0, humidity: 70 }
                        this.handleSensorData(payload)
                            .catch((error) => {
                                console.error('❌ [MQTT] Handle sensor data failed:', error.message);
                            });
                        break;

                    case 'device/status':
                        // Gửi trạng thái LED (ON/OFF)
                        // Payload: { temp_led: "ON", hum_led: "OFF", ... }
                        this.updateDeviceStatus(payload);
                        this.io.emit('device_status_update', payload);
                        break;

                    case 'device/sync':
                        this.markHardwareActivity();
                        this.requestDeviceStateSync('device-sync');
                        break;
                }
            } catch (error) {
                // Nếu hardware gửi chuỗi text không phải JSON (ví dụ lệnh lỗi)
                console.log(`📩 [MQTT Raw] Topic: ${topic} - Msg: ${message.toString()}`);

                if (topic === 'device/sync') {
                    this.markHardwareActivity();
                    this.requestDeviceStateSync('device-sync-raw');
                }
            }
        });
    }

    resolveDeviceCommandPrefix(deviceName = '') {
        const name = this.normalizeText(deviceName);

        const mappingRules = [
            {
                prefix: 'TEMP',
                keywords: ['dev_temp_led', 'temperature', 'temp', 'nhiet ke', 'nhiet do', 'nhiet']
            },
            {
                prefix: 'LDR',
                keywords: ['dev_ldr_led', 'ldr', 'light', 'quang cam', 'anh sang', 'quang']
            },
            {
                prefix: 'HUM',
                keywords: ['dev_hum_led', 'humidity', 'hum', 'do am', 'do_am', 'may bom', 'bom']
            },
            {
                prefix: 'GAS',
                keywords: ['dev_gas_led', 'dev_dust_led', 'gas', 'khoa gas', 'khoa', 'dust', 'bui']
            }
        ];

        const matchedRule = mappingRules.find((rule) =>
            rule.keywords.some((keyword) => name.includes(keyword))
        );

        return matchedRule ? matchedRule.prefix : null;
    }

    async sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async syncDeviceStatesFromDatabase(trigger = 'unknown') {
        if (!this.isConnected()) {
            return;
        }

        this.isSyncInProgress = true;

        try {
            const devices = await query(
                `
                    SELECT id, name, value
                    FROM devices
                    ORDER BY created_at ASC
                `
            );

            for (const device of devices || []) {
                const commandPrefix = this.resolveDeviceCommandPrefix(device?.name);
                if (!commandPrefix) {
                    continue;
                }

                const desiredValue = Number(device?.value) === 1 ? 1 : 0;
                const command = `${commandPrefix}_${desiredValue === 1 ? 'ON' : 'OFF'}`;

                try {
                    await this.publishControl(command);
                    await this.sleep(120);
                } catch (publishError) {
                    console.error('[MQTT] Device sync publish failed:', {
                        trigger,
                        deviceId: device?.id,
                        deviceName: device?.name,
                        command,
                        error: publishError?.message || publishError
                    });
                }
            }

            console.log(`[MQTT] Device state sync completed (trigger: ${trigger})`);
        } catch (error) {
            console.error(`[MQTT] Device state sync failed (trigger: ${trigger}):`, error.message);
        } finally {
            this.isSyncInProgress = false;

            if (this.pendingSyncRequested) {
                this.pendingSyncRequested = false;
                this.requestDeviceStateSync('queued');
            }
        }
    }

    requestDeviceStateSync(trigger = 'unknown') {
        if (!this.isConnected()) {
            return;
        }

        if (this.isSyncInProgress) {
            this.pendingSyncRequested = true;
            return;
        }

        this.pendingSyncRequested = false;
        this.syncDeviceStatesFromDatabase(trigger)
            .catch((error) => {
                console.error('[MQTT] Unexpected sync error:', error?.message || error);
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

        if (name.includes('dev_temp_led') || name.includes('temperature') || name.includes('temp') || name.includes('nhiet ke') || name.includes('nhiet do') || name.includes('nhiet')) {
            return 'temp_led';
        }

        if (name.includes('dev_ldr_led') || name.includes('ldr') || name.includes('light') || name.includes('quang cam') || name.includes('anh sang') || name.includes('quang')) {
            return 'ldr_led';
        }

        if (name.includes('dev_hum_led') || name.includes('humidity') || name.includes('hum') || name.includes('do am') || name.includes('do_am') || name.includes('may bom') || name.includes('bom')) {
            return 'hum_led';
        }

        if (name.includes('dev_gas_led') || name.includes('dev_dust_led') || name.includes('khoa gas') || name.includes('khoa') || name.includes('gas') || name.includes('dust') || name.includes('bui')) {
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

    createOperationError(code, message) {
        const error = new Error(message);
        error.code = code;
        return error;
    }

    waitForConnected(timeoutMs = 10000) {
        if (this.isConnected()) {
            return Promise.resolve(true);
        }

        return new Promise((resolve) => {
            let settled = false;
            let timeoutId = null;
            let reconnectIntervalId = null;

            const cleanup = () => {
                clearTimeout(timeoutId);
                clearInterval(reconnectIntervalId);
                this.mqttClient.off('connect', onConnect);
            };

            const finish = (isConnectedNow) => {
                if (settled) {
                    return;
                }

                settled = true;
                cleanup();
                resolve(Boolean(isConnectedNow));
            };

            const onConnect = () => {
                finish(true);
            };

            this.mqttClient.on('connect', onConnect);

            reconnectIntervalId = setInterval(() => {
                if (this.isConnected()) {
                    finish(true);
                    return;
                }

                try {
                    this.mqttClient.reconnect();
                } catch (error) {
                    // Keep waiting until timeout to allow built-in reconnect logic.
                }
            }, 2000);

            timeoutId = setTimeout(() => {
                finish(this.isConnected());
            }, timeoutMs);

            try {
                this.mqttClient.reconnect();
            } catch (error) {
                // Ignore and rely on interval + mqtt auto reconnect.
            }
        });
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

            let settled = false;

            const cleanupWaiter = (timeoutId) => {
                if (!timeoutId) {
                    return;
                }

                const waiters = this.pendingStatusWaiters.get(stateKey) || [];
                const remaining = waiters.filter((waiter) => waiter.timeoutId !== timeoutId);
                if (remaining.length) {
                    this.pendingStatusWaiters.set(stateKey, remaining);
                } else {
                    this.pendingStatusWaiters.delete(stateKey);
                }
            };

            let timeoutId = null;

            const onDisconnect = () => {
                if (settled) {
                    return;
                }

                settled = true;
                clearTimeout(timeoutId);
                cleanupWaiter(timeoutId);
                this.mqttClient.off('disconnect', onDisconnect);
                reject(this.createOperationError('MQTT_DISCONNECTED_DURING_WAIT', 'MQTT disconnected while waiting for hardware confirmation'));
            };

            this.mqttClient.on('disconnect', onDisconnect);

            timeoutId = setTimeout(() => {
                if (settled) {
                    return;
                }

                settled = true;
                cleanupWaiter(timeoutId);
                this.mqttClient.off('disconnect', onDisconnect);
                reject(this.createOperationError('HARDWARE_CONFIRM_TIMEOUT', 'Timeout waiting for hardware confirmation'));
            }, timeoutMs);

            const waiter = {
                targetValue: normalizedTarget,
                timeoutId,
                resolve: (result) => {
                    if (settled) {
                        return;
                    }

                    settled = true;
                    clearTimeout(timeoutId);
                    this.mqttClient.off('disconnect', onDisconnect);
                    resolve(result);
                },
                reject
            };

            const currentWaiters = this.pendingStatusWaiters.get(stateKey) || [];
            currentWaiters.push(waiter);
            this.pendingStatusWaiters.set(stateKey, currentWaiters);
        });
    }

    async sendCommandAndWait(deviceName, command, targetValue, timeoutMs = 5000) {
        if (!this.isConnected()) {
            throw this.createOperationError('MQTT_NOT_CONNECTED', 'MQTT is not connected');
        }

        const waitPromise = this.waitForDeviceState(deviceName, targetValue, timeoutMs);
        await this.publishControl(command);
        return waitPromise;
    }

    async sendCommandAndWaitWithReconnect(deviceName, command, targetValue, options = {}) {
        const confirmationTimeoutMs = Number(options.confirmationTimeoutMs || 6000);
        const reconnectTimeoutMs = Number(options.reconnectTimeoutMs || 10000);

        const ensureFirstConnection = await this.waitForConnected(reconnectTimeoutMs);
        if (!ensureFirstConnection) {
            throw this.createOperationError('MQTT_RECONNECT_TIMEOUT', 'Cannot reconnect to MQTT within the retry window');
        }

        try {
            return await this.sendCommandAndWait(deviceName, command, targetValue, confirmationTimeoutMs);
        } catch (error) {
            const isDisconnectDuringOperation = error?.code === 'MQTT_DISCONNECTED_DURING_WAIT' || error?.code === 'MQTT_NOT_CONNECTED';
            if (!isDisconnectDuringOperation) {
                throw error;
            }

            const reconnected = await this.waitForConnected(reconnectTimeoutMs);
            if (!reconnected) {
                throw this.createOperationError('MQTT_RECONNECT_TIMEOUT', 'Cannot reconnect to MQTT within the retry window');
            }

            return this.sendCommandAndWait(deviceName, command, targetValue, confirmationTimeoutMs);
        }
    }
}

module.exports = MqttService;