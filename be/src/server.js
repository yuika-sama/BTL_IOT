const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const MqttService = require('./services/mqttService');
const { syncAutoDevicesAndApplyControl } = require('./services/autoControlService');

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

    syncAutoDevicesAndApplyControl({
        mqttService,
        trigger: 'socket-connect'
    }).catch((error) => {
        console.error('❌ [AUTO] Sync on socket connection failed:', error.message);
    });

    // Nhận lệnh điều khiển
    socket.on('send_command', (command) => {
        const currentStatus = buildSocketConnectionStatus();
        if (!currentStatus.success) {
            socket.emit(SOCKET_STATUS_EVENT, currentStatus);
            return;
        }

        console.log(`🖱️ [UI] User clicked: ${command}`);
        mqttService.publishControl(command).catch((error) => {
            console.error('❌ [MQTT] Failed to publish socket command:', error.message);
        });
    });

    socket.on('disconnect', () => {
        console.log(`❌ [Socket.io] Client Disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 [Server] Running at http://localhost:${PORT}`);
});