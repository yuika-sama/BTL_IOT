# API Services Documentation

Hướng dẫn sử dụng các API services trong dự án.

## Import Services

```javascript
// Import từng service riêng lẻ
import { deviceService, sensorService, dataSensorService, actionHistoryService, alertService } from '@/services';

// Hoặc import tất cả
import services from '@/services';
```

## 1. Device Service

### Lấy thông tin tất cả thiết bị
```javascript
const getDevices = async () => {
  try {
    const data = await deviceService.getAllDevicesInfo();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Toggle trạng thái thiết bị
```javascript
const toggleDevice = async (deviceId) => {
  try {
    const data = await deviceService.toggleDeviceStatus(deviceId, 'ON'); // hoặc 'OFF'
    console.log('Device toggled:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## 2. Sensor Service

### Lấy giá trị mới nhất của cảm biến
```javascript
const getLatestSensors = async () => {
  try {
    const data = await sensorService.getLatestValues();
    // data chứa: { temperature, humidity, light, dust }
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## 3. Data Sensor Service

### Lấy lịch sử dữ liệu cảm biến
```javascript
const getSensorHistory = async () => {
  try {
    const params = {
      page: 1,
      limit: 10,
      search: 'sensor1',
      sensorType: 'temperature', // temperature, humidity, light, dust
      sortBy: 'timestamp',
      sortOrder: 'desc',
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    };
    
    const data = await dataSensorService.getSensorHistory(params);
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Lấy dữ liệu tổng hợp cho biểu đồ
```javascript
const getChartData = async (sensorId) => {
  try {
    const params = {
      period: 'day', // hour, day, week, month
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    };
    
    const data = await dataSensorService.getAggregateData(sensorId, params);
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## 4. Action History Service

### Lấy lịch sử hành động
```javascript
const getActionHistory = async () => {
  try {
    const params = {
      page: 1,
      limit: 20,
      search: 'device1',
      action: 'ON', // ON, OFF
      status: 'success', // success, failed
      sortBy: 'timestamp',
      sortOrder: 'desc',
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    };
    
    const data = await actionHistoryService.getAll(params);
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Lấy thống kê lịch sử hành động
```javascript
const getActionStats = async () => {
  try {
    const params = {
      period: 'week' // day, week, month
    };
    
    const data = await actionHistoryService.getStatistics(params);
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## 5. Alert Service

### Lấy danh sách cảnh báo
```javascript
const getAlerts = async () => {
  try {
    const params = {
      page: 1,
      limit: 20,
      search: 'temperature',
      sensorType: 'temperature',
      severity: 'high', // low, medium, high, critical
      status: 'active', // active, resolved, dismissed
      sortBy: 'timestamp',
      sortOrder: 'desc',
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    };
    
    const data = await alertService.getAll(params);
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Lấy thống kê cảnh báo
```javascript
const getAlertStats = async () => {
  try {
    const params = {
      period: 'month' // day, week, month
    };
    
    const data = await alertService.getStatistics(params);
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Sử dụng trong React Component

```javascript
import { useEffect, useState } from 'react';
import { sensorService, deviceService } from '@/services';

function Dashboard() {
  const [sensorData, setSensorData] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sensors, devicesData] = await Promise.all([
        sensorService.getLatestValues(),
        deviceService.getAllDevicesInfo()
      ]);
      
      setSensorData(sensors);
      setDevices(devicesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (deviceId, newStatus) => {
    try {
      await deviceService.toggleDeviceStatus(deviceId, newStatus);
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error toggling device:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      {/* Render components */}
    </div>
  );
}

export default Dashboard;
```

## Error Handling

Tất cả các services đều có error handling tự động. Errors sẽ được log ra console và throw để component có thể xử lý.

```javascript
try {
  const data = await sensorService.getLatestValues();
} catch (error) {
  // error.response?.data?.message chứa thông báo lỗi từ server
  // error.message chứa thông báo lỗi tổng quát
  alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
}
```
