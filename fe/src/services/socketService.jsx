class SocketService {
  constructor() {
    this.listeners = new Map();
  }
  connect() { return null; }
  setupDefaultListeners() { }
  disconnect() { }
  onSensorData(callback) { return () => { }; }
  onAlert(callback) { return () => { }; }
  onDeviceStatus(callback) { return () => { }; }
  on(eventName, callback) { return () => { }; }
  off(eventName, callback) { }
  removeAllListeners() { }
  emit(eventName, data) { }
  isConnected() { return false; }
  getSocket() { return null; }
}

const socketService = new SocketService();
export default socketService;
