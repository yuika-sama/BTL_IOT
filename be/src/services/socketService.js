const { time } = require('console');
const {Server} = require('socket.io');

let io;

const initialize = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('join_device', (deviceId) => {
            socket.join(`device_${deviceId}`);
            console.log(`Socket ${socket.id} joined room device_${deviceId}`);
        });

        socket.on('leave_room', (room) => {
            socket.leave(room);
            console.log(`Socket ${socket.id} left room ${room}`);
        });

        socket.on('message', (data) => {
            console.log('Message from client:', data);

            socket.emit('message_received', {
                success: true,
                data: data,
                timestamp: new Date()
            });
        });

        socket.on('disconnect', (reason) => {
            console.log('Client disconnected:', socket.id, 'Reason:', reason);
        });

        socket.on('error', (error) => {
            console.error('Socket error from client:', socket.id, 'Error:', error);
        });

        socket.emit('connected', {
            message: 'Successfully connected to the server',
            socketId: socket.id,
            timestamp: new Date()
        });
    })

    io.on('error', (error) => {
        console.error('Socket.io server error:', error);
    });

    console.log('Socket.io server initialized');
}

// Broadcast to all connected clients
const broadcast = (event, data) => {
    if (io) {
        io.emit(event, {
            ...data,
            timestamp: new Date()
        });
        console.log(`Broadcasted event '${event}' to all clients`);
    }
}

//  Emit to specific room
const emitToRoom = (room, event, data) => {
    if (io) {
        io.to(room).emit(event, {
            ...data,
            timestamp: new Date()
        });
        console.log(`Emitted event '${event}' to room '${room}'`);
    }
}

const emitToDevice = (deviceId, event, data) => {
    const room = `device_${deviceId}`;
    emitToRoom(room, event, data);
}   

const emitToSensor = (sensorId, event, data) => {
    const room = `sensor_${sensorId}`;
    emitToRoom(room, event, data);
}

const getIO = () => io;

const getClientsCount = () => {
    if (io) {
        return io.sockets.sockets.size;
    }
    return 0;
}

const getClientsInRoom = (room) => {
    if (io) {
        const clients = io.sockets.adapter.rooms.get(room);
        return clients ? clients.size : 0;
    }
    return 0;
}

module.exports = {
    initialize,
    broadcast,
    emitToRoom,
    emitToDevice,
    emitToSensor,
    getIO,
    getClientsCount,
    getClientsInRoom
};