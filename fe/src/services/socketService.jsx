import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  getSocketUrl() {
    const directSocketUrl = import.meta.env.VITE_SOCKET_URL;
    if (directSocketUrl) {
      return directSocketUrl;
    }

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    return apiBaseUrl.replace(/\/api\/?$/, '');
  }

  connect() {
    if (this.socket) {
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return this.socket;
    }

    this.socket = io(this.getSocketUrl(), {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    this.setupDefaultListeners();
    return this.socket;
  }

  setupDefaultListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connect error:', error?.message || error);
    });
  }

  normalizeSensorType(sensorType = '') {
    const type = String(sensorType).trim().toLowerCase();

    if (type.includes('temp') || type.includes('temperature')) return 'temperature';
    if (type.includes('hum') || type.includes('humidity')) return 'humidity';
    if (type.includes('light') || type.includes('ldr')) return 'light';
    if (type.includes('dust') || type.includes('gas')) return 'gas';

    return null;
  }

  normalizeSensorPayload(payload = {}) {
    const inferredType = payload.type || payload.sensor;
    const type = this.normalizeSensorType(inferredType);
    const value = Number(payload.value);

    if (!type || Number.isNaN(value)) {
      return null;
    }

    return {
      ...payload,
      type,
      sensor: type,
      value,
      timestamp: payload.timestamp || new Date().toISOString(),
    };
  }

  disconnect() {
    if (!this.socket) return;
    this.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
  }

  onSensorData(callback) {
    return this.on('sensor_update', (payload) => {
      const normalized = this.normalizeSensorPayload(payload);
      if (normalized) {
        callback(normalized);
      }
    });
  }

  onAlert(callback) {
    return this.on('alert_update', callback);
  }

  onDeviceStatus(callback) {
    return this.on('device_status_update', callback);
  }

  on(eventName, callback) {
    this.connect();

    const wrappedCallback = (data) => {
      callback(data);
    };

    this.socket.on(eventName, wrappedCallback);

    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Map());
    }
    this.listeners.get(eventName).set(callback, wrappedCallback);

    return () => {
      this.off(eventName, callback);
    };
  }

  off(eventName, callback) {
    if (!this.socket || !this.listeners.has(eventName)) return;

    const eventListeners = this.listeners.get(eventName);
    const wrappedCallback = eventListeners.get(callback);

    if (!wrappedCallback) return;

    this.socket.off(eventName, wrappedCallback);
    eventListeners.delete(callback);

    if (!eventListeners.size) {
      this.listeners.delete(eventName);
    }
  }

  removeAllListeners() {
    if (!this.socket) return;

    this.listeners.forEach((eventListeners, eventName) => {
      eventListeners.forEach((wrappedCallback) => {
        this.socket.off(eventName, wrappedCallback);
      });
    });

    this.listeners.clear();
  }

  emit(eventName, data) {
    this.connect();
    this.socket.emit(eventName, data);
  }

  isConnected() {
    return Boolean(this.socket?.connected);
  }

  getSocket() {
    return this.socket;
  }
}

const socketService = new SocketService();
export default socketService;
