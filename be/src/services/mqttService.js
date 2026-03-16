const mqtt = require('mqtt');
require('dotenv').config();

class MqttService {
    constructor(io) {
        this.io = io;
        this.latestDeviceStatus = {};
        this.pendingStatusWaiters = new Map();
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

    init() {
        this.mqttClient.on('connect', () => {
            // Đăng ký các topic mà ESP32 sẽ gửi lên
            this.mqttClient.subscribe(['sensor/data', 'device/status', 'device/sync'], (err) => {
                if (!err) console.log('📡 [MQTT] Subscribed to all topics');
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
                        // Gửi dữ liệu sensor
                        // Payload: { sensor: "temperature", value: 25.0 }
                        this.io.emit('sensor_update', payload);
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