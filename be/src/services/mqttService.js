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
        this.hardwareHeartbeatTimeoutMs = Number(process.env.HARDWARE_HEARTBEAT_TIMEOUT_MS || 10000);
        const brokerUrl = process.env.MQTT_SERVER || 'mqtt://localhost';
        const brokerPort = Number(process.env.MQTT_PORT || 2204);
        this.mqttClient = mqtt.connect(brokerUrl, {
            port: brokerPort,
            username: process.env.MQTT_USERNAME || '',
            password: process.env.MQTT_PASSWORD || '',
            clean: true,
            reconnectPeriod: 10000
        });

        this.init();
    }

    // Chuẩn hoá tên thiết bị để map với trạng thái phần cứng và command prefix
    normalizeText(value = '') {
        return String(value)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    // Chuẩn hoá tên cảm biến để xác định loại sensor từ payload MQTT
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
        if (name.includes('gas')) {
            return 'gas';
        }

        return null;
    }

    // Trích xuất dữ liệu cảm biến từ payload MQTT
    extractSensorReadings(payload = {}) {
        const timestamp = payload.timestamp || new Date().toISOString();
        const readings = [];

        if (payload.sensor !== undefined && payload.value !== undefined) {
            // Hỗ trợ payload dạng { sensor: "temperature", value: 25.0 }
            const type = this.normalizeSensorType(payload.sensor);
            const value = Number(payload.value);

            if (type && !Number.isNaN(value)) {
                readings.push({ type, sensor: type, value, timestamp });
            }

            return readings;
        }

        // Hỗ trợ payload dạng batch: { temperature: 25.0, humidity: 70 }
        Object.entries(payload).forEach(([key, rawValue]) => {
            const type = this.normalizeSensorType(key);
            const value = Number(rawValue);

            if (type && !Number.isNaN(value)) {
                readings.push({ type, sensor: type, value, timestamp });
            }
        });

        return readings;
    }

    // Lấy cấu hình cảm biến từ database dựa trên loại sensor
    async getSensorConfigByType(type) {
        const condition = SENSOR_TYPE_CONDITIONS[type];
        if (!condition) {
            return null;
        }

        // Truy vấn sensor đầu tiên khớp với tên cảm biến
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

    // Chuyển đổi timestamp sang định dạng MySQL DATETIME
    // Định dạng: 'YYYY-MM-DD HH:MM:SS'
    toMySqlDateTime(input) {
        const parsedDate = input ? new Date(input) : new Date();
        const date = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
        return date.toISOString().slice(0, 19).replace('T', ' ');
    }

    // Chèn dữ liệu cảm biến vào database
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

    // Cập nhật trạng thái thiết bị dựa trên payload MQTT vào database
    async persistSensorReading(reading) {
        const sensor = await this.getSensorConfigByType(reading.type);
        if (!sensor) {
            return;
        }

        await this.insertSensorData(sensor.id, reading.value, reading.timestamp);
    }

    // Phát sự kiện cập nhật cảm biến đến tất cả client kết nối qua event 'sensor_updates'
    emitSensorUpdate(readings = []) {
        readings.forEach((reading) => {
            this.io.emit('sensor_update', reading);
        });
    }

    // Xử lý dữ liệu cảm biến nhận được từ MQTT, bao gồm trích xuất, lưu vào database và phát sự kiện cập nhật
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

    //  Đánh dấu hoạt động phần cứng để theo dõi kết nối và đồng bộ trạng thái khi có hoạt động mới
    markHardwareActivity() {
        const wasConnected = this.isHardwareConnected();
        this.lastHardwareActivityAt = Date.now();

        if (!wasConnected) {
            this.requestDeviceStateSync('hardware-activity');
        }
    }

    // Kiểm tra xem phần cứng có đang được kết nối dựa trên hoạt động gần đây hay không
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
        // Thiết lập kết nối MQTT và đăng ký các sự kiện
        this.mqttClient.on('connect', () => {
            // Đăng ký các topic mà ESP32 sẽ gửi lên
            this.mqttClient.subscribe(['sensor/data', 'device/status', 'device/sync'], (err) => {
                if (!err) console.log('📡 [MQTT] Subscribed to all topics');
            });

            this.requestDeviceStateSync('mqtt-connect');
        });

        // Đăng ký sự kiện ngắt kết nối để đánh dấu phần cứng không còn kết nối
        this.mqttClient.on('disconnect', () => {
            console.log('⚠️ [MQTT] Disconnected from Broker');
            this.lastHardwareActivityAt = 0;
        });

        // Đăng ký sự kiện nhận tin nhắn từ MQTT và xử lý theo topic
        this.mqttClient.on('message', (topic, message) /* Nhận tin nhắn và xử lý theo topic */ => {
            try {
                const payload = JSON.parse(message.toString());

                // Bất kỳ hoạt động nào từ phần cứng cũng được coi là dấu hiệu của kết nối đang hoạt động
                if (topic === 'sensor/data' || topic === 'device/status') {
                    this.markHardwareActivity();
                }
                
                // Xử lý dữ liệu cảm biến, 
                // cập nhật trạng thái thiết bị 
                // hoặc đồng bộ trạng thái theo topic
                switch (topic) {
                    // Dữ liệu cảm biến mới từ phần cứng, 
                    // cần trích xuất và lưu vào database, 
                    // sau đó phát sự kiện cập nhật
                    case 'sensor/data':
                        this.handleSensorData(payload)
                            .catch((error) => {
                                console.error('❌ [MQTT] Handle sensor data failed:', error.message);
                            });
                        break;

                    // Xử lý toggle thiết bị
                    case 'device/status':
                        // Gửi trạng thái LED (ON/OFF)
                        // Payload: { temp_led: "ON", hum_led: "OFF", ... }
                        this.updateDeviceStatus(payload);
                        this.io.emit('device_status_update', payload);
                        break;

                    // Yêu cầu đồng bộ trạng thái thiết bị, 
                    // gửi sau khi ESP32 khởi động lại để 
                    // đảm bảo trạng thái phần cứng và database được đồng bộ
                    // Flow: 
                    // Đánh dấu thiết bị đang hoạt động 
                    // -> Đồng bộ trạng thái thiết bị từ database 
                    // -> Cập nhật trạng thái mới nhất cho ESP32
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

    // Giải mã tiền tố lệnh điều khiển từ tên thiết bị để map với command prefix
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
            },
            {
                prefix: 'LED_A',
                keywords: ['dev_green_led', 'green_led', 'led xanh', 'den xanh', 'đèn xanh']
            },
            {
                prefix: 'LED_B',
                keywords: ['dev_red_led', 'red_led', 'led do', 'led đỏ', 'den do', 'đèn đỏ']
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

    // Đồng bộ trạng thái thiết bị từ database, 
    // được gọi khi có hoạt động phần cứng mới 
    // hoặc yêu cầu đồng bộ từ ESP32
    // Flow:
    // Kiểm tra kết nối MQTT và trạng thái đồng bộ hiện tại
    // -> Truy vấn trạng thái thiết bị từ database
    // -> Gửi lệnh điều khiển tương ứng đến ESP32 để đồng bộ trạng thái phần cứng
    async syncDeviceStatesFromDatabase(trigger = 'unknown') {
        if (!this.isConnected()) {
            return;
        }

        this.isSyncInProgress = true;

        try {
            // Truy vấn tất cả thiết bị và trạng thái hiện tại từ database
            const devices = await query(
                `
                    SELECT id, name, value
                    FROM devices
                    ORDER BY created_at ASC
                `
            );

            // Dựa trên tên thiết bị, giải mã tiền tố lệnh điều khiển và giá trị mong muốn 
            // và gửi lệnh đồng bộ đến ESP32
            for (const device of devices || []) {
                const commandPrefix = this.resolveDeviceCommandPrefix(device?.name);
                if (!commandPrefix) {
                    continue;
                }

                const desiredValue = Number(device?.value) === 1 ? 1 : 0;
                const command = `${commandPrefix}_${desiredValue === 1 ? 'ON' : 'OFF'}`;

                // Gửi lệnh điều khiển đến ESP32 để đồng bộ trạng thái phần cứng với database
                try {
                    await this.publishControl(command);
                    await this.sleep(60);
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
            // Đánh dấu kết thúc đồng bộ 
            // và nếu có yêu cầu đồng bộ mới trong quá trình này, 
            // thực hiện đồng bộ lại để đảm bảo trạng thái luôn được cập nhật
            this.isSyncInProgress = false;

            if (this.pendingSyncRequested) {
                this.pendingSyncRequested = false;
                this.requestDeviceStateSync('queued');
            }
        }
    }

    // Yêu cầu đồng bộ trạng thái thiết bị
    // Flow: Kiểm tra nếu đang có kết nối MQTT và không có đồng bộ nào đang diễn ra,
    // - nếu có đồng bộ đang diễn ra thì đánh dấu có yêu cầu đồng bộ mới và sẽ thực hiện ngay sau khi hoàn thành đồng bộ hiện tại,
    // - nếu không có đồng bộ nào đang diễn ra thì thực hiện đồng bộ ngay lập tức
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

    getStateKeyByCommand(command = '') {
        const normalizedCommand = String(command || '').trim().toUpperCase();
        const prefix = normalizedCommand.split('_').slice(0, -1).join('_');

        const commandKeyMap = {
            TEMP: 'temp_led',
            HUM: 'hum_led',
            LDR: 'ldr_led',
            GAS: 'gas_led',
            LED_A: 'led_a',
            LED_B: 'led_b'
        };

        return commandKeyMap[prefix] || null;
    }

    // Giải mã tên thiết bị để xác định key trạng thái phần cứng tương ứng,
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

        if (name.includes('dev_green_led') || name.includes('green_led') || name.includes('led xanh') || name.includes('led_xanh') || name.includes('den xanh') || name.includes('den_xanh') || name.includes('đèn xanh') || name.includes('đèn_xanh')) {
            return 'led_a';
        }


        return null;
    }

    // Cập nhật trạng thái thiết bị dựa trên payload MQTT,
    // được gọi khi nhận được cập nhật trạng thái thiết bị từ ESP32,
    // đồng thời giải quyết các waiter đang chờ xác nhận phần cứng nếu có
    // Flow: Cập nhật trạng thái thiết bị mới nhất từ payload MQTT vào bộ nhớ,
    // -> kiểm tra nếu có waiter nào đang chờ xác nhận phần cứng với giá trị mới này, 
    // -> nếu có thì giải quyết waiter đó và loại bỏ khỏi danh sách chờ
    // waiter là các Promise đang chờ xác nhận phần cứng sau khi gửi lệnh điều khiển
    updateDeviceStatus(payload = {}) {
        const aliasKeyMap = {
            green_led: 'led_a',
            red_led: 'led_b'
        };

        Object.keys(payload).forEach((key) => {
            // Chuẩn hoá
            const lowerKey = String(key).toLowerCase();
            const normalizedKey = aliasKeyMap[lowerKey] || lowerKey;
            const isSupportedStatusKey = normalizedKey.endsWith('_led') || normalizedKey === 'led_a' || normalizedKey === 'led_b';

            if (!isSupportedStatusKey) {
                return;
            }

            // Cập nhật trạng thái thiết bị mới nhất từ payload MQTT vào bộ nhớ
            const state = this.normalizeStateValue(payload[key]);
            this.latestDeviceStatus[normalizedKey] = state;

            // Kiểm tra nếu có waiter nào đang chờ xác nhận phần cứng với giá trị mới này,
            const waiters = this.pendingStatusWaiters.get(normalizedKey);
            if (!waiters || !waiters.length) {
                return;
            }

            // Nếu có thì giải quyết waiter đó và loại bỏ khỏi danh sách chờ
            const unresolvedWaiters = [];
            waiters.forEach((waiter) => {
                if (waiter.targetValue === state) {
                    clearTimeout(waiter.timeoutId);
                    waiter.resolve({ key: normalizedKey, value: state });
                } else {
                    unresolvedWaiters.push(waiter);
                }
            });

            // Cập nhật lại danh sách waiter đang chờ nếu còn waiter nào chưa được giải quyết,  
            if (unresolvedWaiters.length) {
                this.pendingStatusWaiters.set(normalizedKey, unresolvedWaiters);
            } else {
                this.pendingStatusWaiters.delete(normalizedKey);
            }
        });
    }

    isConnected() {
        return Boolean(this.mqttClient?.connected);
    }

    // Tạo lỗi có mã lỗi để phân biệt các loại lỗi khác nhau trong quá trình gửi lệnh và chờ xác nhận phần cứng
    createOperationError(code, message) {
        const error = new Error(message);
        error.code = code;
        return error;
    }

    // Tạo Promise kết nối MQTT trong một khoảng thời gian nhất định, 
    // được sử dụng để đảm bảo có kết nối MQTT trước khi gửi lệnh điều khiển 
    // hoặc đồng bộ trạng thái thiết bị
    // Flow: Nếu đã có kết nối MQTT thì resolve ngay,
    // -> nếu chưa có kết nối MQTT thì đăng ký sự kiện 'connect' để resolve khi kết nối được thiết lập, 
    // -> đồng thời thiết lập interval để thử reconnect định kỳ và timeout để ngừng chờ sau khoảng thời gian nhất định
    waitForConnected(timeoutMs = 10000) {
        if (this.isConnected()) {
            return Promise.resolve(true);
        }

        return new Promise((resolve) => {
            let settled = false;
            let timeoutId = null;
            let reconnectIntervalId = null;

            // Cleanup function để loại bỏ sự kiện và interval khi đã có kết quả hoặc hết thời gian chờ
            const cleanup = () => {
                clearTimeout(timeoutId);
                clearInterval(reconnectIntervalId);
                this.mqttClient.off('connect', onConnect);
            };

            // Hàm để hoàn tất chờ đợi với kết quả có kết nối hay không, đảm bảo chỉ resolve/reject một lần duy nhất
            const finish = (isConnectedNow) => {
                if (settled) {
                    return;
                }

                settled = true;
                cleanup();
                resolve(Boolean(isConnectedNow));
            };

            this.mqttClient.on('connect', () => {finish(true);});

            // Thiết lập interval để thử reconnect định kỳ nếu chưa có kết nối,
            // và thiết lập timeout để ngừng chờ sau khoảng thời gian nhất định
            // Interval: Mỗi 2 giây thử reconnect nếu chưa có kết nối,
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

            // Timeout: Nếu sau khoảng thời gian nhất định vẫn chưa có kết nối thì dừng chờ và resolve false
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

    // Gửi lệnh điều khiển đến ESP32 thông qua MQTT, được sử dụng để bật/tắt thiết bị từ backend
    // Flow: Kiểm tra nếu chưa có kết nối MQTT thì reject ngay,
    // -> nếu có kết nối MQTT thì publish lệnh điều khiển lên topic 'device/control' và resolve/reject dựa trên kết quả publish
    //  Lệnh điều khiển được publish sẽ có dạng: 'TEMP_ON', 'HUM_OFF',...
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

    // Tạo một Promise để chờ xác nhận phần cứng sau khi gửi lệnh điều khiển,
    // Flow: Kiểm tra nếu chưa có kết nối MQTT thì reject ngay,
    // -> nếu có kết nối MQTT thì đăng ký một waiter để chờ xác nhận phần cứng với giá trị mong muốn, 
    // -> đồng thời thiết lập timeout để reject nếu hết thời gian chờ mà không nhận được xác nhận từ phần cứng
    waitForDeviceState(deviceName, targetValue, timeoutMs = 5000, command = '') {
        return new Promise((resolve, reject) => {
            // Map tên thiết bị
            const stateKey = this.getStateKeyByDeviceName(deviceName) || this.getStateKeyByCommand(command);
            if (!stateKey) {
                reject(new Error('Cannot map device name to hardware status key'));
                return;
            }

            // Chuẩn hoá giá trị ON/OFF
            const normalizedTarget = this.normalizeStateValue(targetValue);
            if (this.latestDeviceStatus[stateKey] === normalizedTarget) {
                resolve({ key: stateKey, value: normalizedTarget, immediate: true });
                return;
            }

            let settled = false;

            // Cleanup function để loại bỏ waiter khỏi danh sách chờ khi đã có kết quả hoặc hết thời gian chờ
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

            // Đăng ký sự kiện ngắt kết nối để reject nếu MQTT bị ngắt trong quá trình chờ xác nhận phần cứng,
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

            // Thiết lập timeout để reject nếu hết thời gian chờ mà không nhận được xác nhận từ phần cứng
            timeoutId = setTimeout(() => {
                if (settled) {
                    return;
                }

                settled = true;
                cleanupWaiter(timeoutId);
                this.mqttClient.off('disconnect', onDisconnect);
                reject(this.createOperationError('HARDWARE_CONFIRM_TIMEOUT', 'Timeout waiting for hardware confirmation'));
            }, timeoutMs);

            // Đăng ký một waiter để chờ xác nhận phần cứng với giá trị mong muốn,
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

    // Gửi lệnh điều khiển và chờ xác nhận phần cứng
    // Flow: Kiểm tra nếu chưa có kết nối MQTT thì reject ngay,
    // -> nếu có kết nối MQTT thì gửi lệnh điều khiển đến ESP32, 
    // -> sau đó chờ đợi trạng thái của thiết bị được cập nhật từ MQTT để xác nhận phần cứng đã thực hiện lệnh điều khiển, 
    // -> reject nếu trong quá trình chờ có sự cố về kết nối MQTT hoặc hết thời gian chờ mà không nhận được xác nhận từ phần cứng
    async sendCommandAndWait(deviceName, command, targetValue, timeoutMs = 5000) {
        if (!this.isConnected()) {
            throw this.createOperationError('MQTT_NOT_CONNECTED', 'MQTT is not connected');
        }

        const waitPromise = this.waitForDeviceState(deviceName, targetValue, timeoutMs, command);
        await this.publishControl(command);
        return waitPromise;
    }

    // Gửi lệnh điều khiển và chờ xác nhận phần cứng với logic 
    // tự động thử reconnect nếu bị ngắt kết nối MQTT trong quá trình chờ xác nhận
    // Flow: Kiểm tra nếu chưa có kết nối MQTT thì reject ngay,
    // -> nếu có kết nối MQTT thì gửi lệnh điều khiển đến ESP32, 
    // -> sau đó chờ đợi trạng thái của thiết bị được cập nhật từ MQTT để xác nhận phần cứng đã thực hiện lệnh điều khiển, 
    // -> nếu trong quá trình chờ có sự cố về kết nối MQTT thì tự động thử reconnect và nếu reconnect thành công thì tiếp tục chờ xác nhận phần cứng, 
    // -> reject nếu hết thời gian chờ mà không nhận được xác nhận từ phần cứng hoặc không thể reconnect MQTT trong khoảng thời gian nhất định
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