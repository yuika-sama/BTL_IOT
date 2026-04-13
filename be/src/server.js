const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const MqttService = require('./services/mqttService');

const PORT = 5000;
const SOCKET_STATUS_EVENT = 'connection_status';
const CONNECTION_MONITOR_INTERVAL_MS = 2000;
const server = http.createServer(app);

// Khởi tạo Socket.io với CORS
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
});

// Khởi tạo MQTT Service và truyền instance io
const mqttService = new MqttService(io);
app.locals.mqttService = mqttService;

// Hàm xây dựng trạng thái kết nối để gửi qua Socket.io
function buildSocketConnectionStatus() {
    const mqttConnected = mqttService.isConnected();
    const hardwareConnected = mqttService.isHardwareConnected();
    const success = mqttConnected && hardwareConnected;

    let message = 'He thong ket noi on dinh';
    if (!mqttConnected) {
        message = 'Mat ket noi MQTT toi backend';
    } else if (!hardwareConnected) {
        message = 'Mat ket noi toi thiet bi (khong co heartbeat)';
    }

    return {
        success,
        mqttConnected,
        hardwareConnected,
        message,
        timestamp: new Date().toISOString()
    };
}

setInterval(() => {
    io.emit(SOCKET_STATUS_EVENT, buildSocketConnectionStatus());
}, CONNECTION_MONITOR_INTERVAL_MS);

// Lắng nghe kết nối
io.on('connection', (socket) => {
    console.log(`🔌 [Socket.io] New Client Connected: ${socket.id}`);

    socket.emit(SOCKET_STATUS_EVENT, buildSocketConnectionStatus());

    socket.on('disconnect', () => {
        console.log(`❌ [Socket.io] Client Disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 [Server] Running at http://localhost:${PORT}`);
});