const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const MqttService = require('./services/mqttService');

const PORT = 5000;
const server = http.createServer(app);

// Khởi tạo Socket.io với CORS
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true // Hỗ trợ các phiên bản socket cũ
});

// Khởi tạo MQTT Service và truyền instance io
const mqttService = new MqttService(io);
app.locals.mqttService = mqttService;

// Lắng nghe kết nối từ
io.on('connection', (socket) => {
    console.log(`🔌 [Socket.io] New Client Connected: ${socket.id}`);

    // Nhận lệnh điều khiển
    socket.on('send_command', (command) => {
        console.log(`🖱️ [UI] User clicked: ${command}`);
        mqttService.publishControl(command).catch((error) => {
            console.error('❌ [MQTT] Failed to publish socket command:', error.message);
        });
    });

    const heartbeat = setInterval(() => {
        socket.emit('heartbeat', { time: new Date().getTime() });
    }, 10000);

    socket.on('disconnect', () => {
        console.log(`❌ [Socket.io] Client Disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 [Server] Running at http://localhost:${PORT}`);
});