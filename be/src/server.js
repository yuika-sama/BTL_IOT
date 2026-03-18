const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const MqttService = require('./services/mqttService');
const { syncAutoDevicesAndApplyControl } = require('./services/autoControlService');

const PORT = 5000;
const SOCKET_STATUS_EVENT = 'connection_status';
const HARDWARE_MONITOR_INTERVAL_MS = 3000;
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

function isSystemReadyForSocket() {
    return mqttService.isConnected() && mqttService.isHardwareConnected();
}

let lastReadyState = isSystemReadyForSocket();
setInterval(() => {
    const isReady = isSystemReadyForSocket();
    if (isReady === lastReadyState) {
        return;
    }

    lastReadyState = isReady;
    if (!isReady) {
        console.warn('⚠️ [Socket.io] Hardware offline. Disconnecting all socket clients.');
        io.emit(SOCKET_STATUS_EVENT, {
            success: false,
            message: 'Hardware is offline. Socket connections are closed.'
        });
        io.disconnectSockets(true);
        return;
    }

    console.log('✅ [Socket.io] Hardware online. New socket connections are accepted.');
}, HARDWARE_MONITOR_INTERVAL_MS);

// Lắng nghe kết nối
io.on('connection', (socket) => {
    console.log(`🔌 [Socket.io] New Client Connected: ${socket.id}`);

    if (!isSystemReadyForSocket()) {
        console.warn(`⚠️ [Socket.io] Rejecting client ${socket.id}: MQTT/hardware is not ready`);
        socket.emit(SOCKET_STATUS_EVENT, {
            success: false,
            message: 'MQTT or hardware is not connected. Socket connection closed.'
        });
        setTimeout(() => socket.disconnect(true), 100);
        return;
    }

    socket.emit(SOCKET_STATUS_EVENT, {
        success: true,
        message: 'Socket connected successfully. MQTT and hardware are ready.'
    });

    syncAutoDevicesAndApplyControl({
        mqttService,
        trigger: 'socket-connect'
    }).catch((error) => {
        console.error('❌ [AUTO] Sync on socket connection failed:', error.message);
    });

    // Nhận lệnh điều khiển
    socket.on('send_command', (command) => {
        if (!isSystemReadyForSocket()) {
            socket.emit(SOCKET_STATUS_EVENT, {
                success: false,
                message: 'Hardware is offline. Socket connection closed.'
            });
            setTimeout(() => socket.disconnect(true), 100);
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