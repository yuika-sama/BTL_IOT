import { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';

/**
 * Component demo sử dụng Socket Service
 * Hiển thị kết nối real-time và dữ liệu từ socket
 */
function SocketDemo() {
  const [isConnected, setIsConnected] = useState(false);
  const [sensorData, setSensorData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [logs, setLogs] = useState([]);

  const { onSensorData, onAlert, onDeviceStatus, emit, socket } = useSocket({
    autoConnect: true,
    autoDisconnect: true,
  });

  // Thêm log
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [{
      time: timestamp,
      message,
      type
    }, ...prev].slice(0, 20)); // Giữ 20 logs mới nhất
  };

  // Kiểm tra trạng thái kết nối
  useEffect(() => {
    const checkConnection = setInterval(() => {
      const connected = socket.isConnected();
      setIsConnected(connected);
    }, 1000);

    return () => clearInterval(checkConnection);
  }, [socket]);

  // Lắng nghe các events
  useEffect(() => {
    // Lắng nghe sensor data
    const unsubscribe1 = onSensorData((data) => {
      addLog(`📊 Received sensor data: ${data.sensor_name} = ${data.value}${data.unit}`, 'success');
      setSensorData(prev => [data, ...prev].slice(0, 10)); // Giữ 10 bản ghi mới nhất
    });

    // Lắng nghe alerts
    const unsubscribe2 = onAlert((alert) => {
      addLog(`🚨 Alert: ${alert.message}`, 'warning');
      setAlerts(prev => [alert, ...prev].slice(0, 5)); // Giữ 5 alerts mới nhất
    });

    // Lắng nghe device status
    const unsubscribe3 = onDeviceStatus((status) => {
      addLog(`📡 Device status updated: ${status.device_id}`, 'info');
      setDeviceStatus(status);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    };
  }, [onSensorData, onAlert, onDeviceStatus]);

  // Test emit event
  const handleTestEmit = () => {
    const testData = {
      message: 'Hello from client',
      timestamp: new Date().toISOString()
    };
    emit('test_event', testData);
    addLog('📤 Sent test event to server', 'info');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Socket.IO Demo</h1>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm">
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sensor Data */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">📊 Sensor Data (Real-time)</h2>
          {sensorData.length === 0 ? (
            <p className="text-gray-500">Waiting for sensor data...</p>
          ) : (
            <div className="space-y-2">
              {sensorData.map((data, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="font-medium">{data.sensor_name}</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {data.value} {data.unit}
                  </div>
                  <div className="text-xs text-gray-500">
                    Device: {data.device_id} | {new Date(data.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">🚨 Alerts</h2>
          {alerts.length === 0 ? (
            <p className="text-gray-500">No alerts yet</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border ${
                    alert.level === 'danger'
                      ? 'bg-red-50 border-red-200'
                      : alert.level === 'warning'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="font-medium">{alert.message}</div>
                  <div className="text-xs text-gray-500">
                    Level: {alert.level} | {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Device Status */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">📡 Device Status</h2>
        {deviceStatus ? (
          <div className="bg-gray-50 p-4 rounded">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(deviceStatus, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-gray-500">No device status received yet</p>
        )}
      </div>

      {/* Test Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">🔧 Test Controls</h2>
        <button
          onClick={handleTestEmit}
          disabled={!isConnected}
          className={`px-4 py-2 rounded font-medium ${
            isConnected
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          📤 Send Test Event
        </button>
      </div>

      {/* Event Logs */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4">📋 Event Logs</h2>
        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet...</div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`mb-1 ${
                  log.type === 'error'
                    ? 'text-red-400'
                    : log.type === 'warning'
                    ? 'text-yellow-400'
                    : log.type === 'success'
                    ? 'text-green-400'
                    : 'text-blue-400'
                }`}
              >
                [{log.time}] {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default SocketDemo;
