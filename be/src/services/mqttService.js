const mqtt = require('mqtt');

class MqttService {
    constructor(io) {
        this.io = io;
        this.client = mqtt.connect('mqtt://10.124.144.200:2204', {
            username: 'yuika',
            password: 'G1nkosora'
        });

        this.init();
    }

    init() {
        this.client.on('connect', () => {
            console.log('✅ Connected to MQTT Broker');
            this.client.subscribe(['sensor/data', 'device/status']);
        });

        this.client.on('message', (topic, message) => {
            const data = JSON.parse(message.toString());
            console.log(`📩 New message from ${topic}:`, data);

            // Forward dữ liệu tới React thông qua Socket.io
            if (topic === 'sensor/data') {
                this.io.emit('sensor_update', data);
            } else if (topic === 'device/status') {
                this.io.emit('device_status_update', data);
            }
        });
    }

    // Hàm để Backend gửi lệnh xuống Hardware
    sendCommand(command) {
        this.client.publish('device/control', command);
    }
}

module.exports = MqttService;