const mqtt = require('mqtt');

class MqttService {
    constructor(io) {
        this.io = io;
        this.mqttClient = mqtt.connect('mqtt://localhost:2204', {
            username: 'yuika',
            password: 'G1nkosora',
            clean: true,
            reconnectPeriod: 5000
        });

        this.init();
    }

    init() {
        this.mqttClient.on('connect', () => {
            console.log('✅ [MQTT] Connected to Broker localhost:2204');
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

    // Hàm gửi lệnh xuống cho ESP32
    publishControl(command) {
        if (this.mqttClient.connected) {
            this.mqttClient.publish('device/control', command.toUpperCase());
            console.log(`📤 [MQTT] Published command: ${command}`);
        }
    }
}

module.exports = MqttService;