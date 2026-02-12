import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  /**
   * Kết nối tới Socket.IO server
   */
  connect() {
    const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

    if (this.socket?.connected) {
      console.log('✅ Socket already connected');
      return this.socket;
    }

    // Clean up old socket if exists
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.close();
    }

    this.socket = io(serverUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 10000,
      autoConnect: true,
      forceNew: false,
      upgrade: false,
      path: '/socket.io/',
      withCredentials: false
    });

    this.setupDefaultListeners();
    console.log('🔌 Connecting to socket server:', serverUrl);

    return this.socket;
  }

  /**
   * Thiết lập các listener mặc định
   */
  setupDefaultListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server đã disconnect, cần reconnect manually
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error.message);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      if (attemptNumber === 1) {
        console.log('🔄 Attempting to reconnect...');
      }
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('🔴 Reconnection error:', error.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('🔴 Failed to reconnect to socket server');
    });
  }

  /**
   * Ngắt kết nối socket
   */
  disconnect() {
    if (this.socket) {
      this.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 Socket disconnected');
    }
  }

  /**
   * Lắng nghe dữ liệu sensor
   * @param {Function} callback - Function xử lý khi nhận dữ liệu sensor
   */
  onSensorData(callback) {
    return this.on('sensor_data', callback);
  }

  /**
   * Lắng nghe cảnh báo
   * @param {Function} callback - Function xử lý khi nhận cảnh báo
   */
  onAlert(callback) {
    return this.on('alert', callback);
  }

  /**
   * Lắng nghe trạng thái thiết bị
   * @param {Function} callback - Function xử lý khi nhận trạng thái thiết bị
   */
  onDeviceStatus(callback) {
    return this.on('device_status', callback);
  }

  /**
   * Lắng nghe event tùy chỉnh
   * @param {String} eventName - Tên event
   * @param {Function} callback - Function xử lý event
   */
  on(eventName, callback) {
    if (!this.socket) {
      console.warn('⚠️ Socket not connected. Please call connect() first');
      return () => {};
    }

    // Lưu listener để có thể remove sau
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);

    this.socket.on(eventName, callback);
    console.log('👂 Listening to event:', eventName);

    // Trả về function để remove listener
    return () => this.off(eventName, callback);
  }

  /**
   * Gỡ bỏ listener
   * @param {String} eventName - Tên event
   * @param {Function} callback - Function callback cần remove
   */
  off(eventName, callback) {
    if (!this.socket) return;

    this.socket.off(eventName, callback);

    // Remove từ listeners Map
    if (this.listeners.has(eventName)) {
      const callbacks = this.listeners.get(eventName);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      if (callbacks.length === 0) {
        this.listeners.delete(eventName);
      }
    }

    console.log('🔇 Removed listener for event:', eventName);
  }

  /**
   * Gỡ bỏ tất cả listeners
   */
  removeAllListeners() {
    if (!this.socket) return;

    this.listeners.forEach((callbacks, eventName) => {
      this.socket.off(eventName);
    });

    this.listeners.clear();
    console.log('🔇 Removed all custom listeners');
  }

  /**
   * Emit event tới server
   * @param {String} eventName - Tên event
   * @param {*} data - Dữ liệu gửi kèm
   */
  emit(eventName, data) {
    if (!this.socket) {
      console.warn('⚠️ Socket not connected. Cannot emit event:', eventName);
      return;
    }

    this.socket.emit(eventName, data);
    console.log('📤 Emitted event:', eventName, data);
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  isConnected() {
    return this.socket?.connected || false;
  }

  /**
   * Lấy socket instance
   */
  getSocket() {
    return this.socket;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
