const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const MqttService = require('./services/mqttService');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Khởi tạo Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", // Trong thực tế nên giới hạn domain frontend
        methods: ["GET", "POST"]
    }
});

// Khởi tạo MQTT Service
const mqttService = new MqttService(io);

io.on('connection', (socket) => {
    console.log(`🔌 New Client Connected: ${socket.id}`);

    // Nhận lệnh điều khiển từ Frontend
    socket.on('control_device', (command) => {
        mqttService.sendCommand(command);
    });

    socket.on('disconnect', () => {
        console.log('❌ Client Disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server is listening on port ${PORT}`);
});