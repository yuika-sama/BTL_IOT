import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout.jsx';
import InforCard from '../components/InforCard.jsx';
import ToggleCard from '../components/ToggleCard.jsx';
import Chart from '../components/Chart.jsx';
import { useSocket } from '../hooks/useSocket.jsx';
import { deviceService, dataSensorService } from '../services';

export default function Dashboard() {
    // State cho sensor data realtime
    const [sensorData, setSensorData] = useState({
        temperature: 0,
        humidity: 0,
        light: 0,
        dust: 0
    });

    // State cho chart data
    const [temperatureData, setTemperatureData] = useState([]);
    const [humidityData, setHumidityData] = useState([]);
    const [lightData, setLightData] = useState([]);
    const [dustData, setDustData] = useState([]);

    // State cho devices
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartDataLoaded, setChartDataLoaded] = useState(false);

    // Socket hook
    const { onSensorData, onDeviceStatus, isConnected } = useSocket();

    // Fetch danh sách devices và dữ liệu ban đầu cho biểu đồ khi mount
    useEffect(() => {
        fetchDevices();
        fetchInitialChartData();
    }, []);

    // Fetch dữ liệu ban đầu cho biểu đồ
    const fetchInitialChartData = async () => {
        try {
            console.log('📊 Fetching initial chart data...');
            const response = await dataSensorService.getInitialChartData({ limit: 20 });
            
            console.log('📊 API Response:', response);
            
            // baseApi interceptor đã unwrap response.data, nên response là { success, data }
            if (response && response.success) {
                const { temperature, humidity, light, dust } = response.data;
                
                console.log('📊 Chart data received:', {
                    temperature: temperature?.length || 0,
                    humidity: humidity?.length || 0,
                    light: light?.length || 0,
                    dust: dust?.length || 0
                });
                
                // Format data cho chart (đã sorted từ cũ đến mới)
                setTemperatureData(temperature || []);
                setHumidityData(humidity || []);
                setLightData(light || []);
                setDustData(dust || []);
                
                // Set giá trị hiện tại từ điểm dữ liệu mới nhất
                if (temperature?.length > 0) {
                    setSensorData(prev => ({ 
                        ...prev, 
                        temperature: temperature[temperature.length - 1].value 
                    }));
                }
                if (humidity?.length > 0) {
                    setSensorData(prev => ({ 
                        ...prev, 
                        humidity: humidity[humidity.length - 1].value 
                    }));
                }
                if (light?.length > 0) {
                    setSensorData(prev => ({ 
                        ...prev, 
                        light: light[light.length - 1].value 
                    }));
                }
                if (dust?.length > 0) {
                    setSensorData(prev => ({ 
                        ...prev, 
                        dust: dust[dust.length - 1].value 
                    }));
                }
                
                setChartDataLoaded(true);
                console.log('✅ Initial chart data loaded successfully');
            } else {
                console.warn('⚠️ Response data structure unexpected:', response);
                setChartDataLoaded(true);
            }
        } catch (error) {
            console.error('❌ Error fetching initial chart data:', error);
            setChartDataLoaded(true); // Still mark as loaded to continue
        }
    };

    // Lắng nghe sensor data từ socket
    useEffect(() => {
        if (!chartDataLoaded) return; // Đợi load dữ liệu ban đầu xong
        
        const unsubscribe = onSensorData((data) => {
            console.log('📊 Received sensor data:', data);
            
            // Cập nhật current values
            if (data.type === 'temperature') {
                setSensorData(prev => ({ ...prev, temperature: data.value }));
                setTemperatureData(prev => {
                    const newData = [...prev, { 
                        timestamp: data.timestamp, 
                        value: data.value 
                    }];
                    // Giữ 20 điểm gần nhất, dữ liệu mới thêm vào cuối
                    return newData.slice(-20);
                });
            } else if (data.type === 'humidity') {
                setSensorData(prev => ({ ...prev, humidity: data.value }));
                setHumidityData(prev => {
                    const newData = [...prev, { 
                        timestamp: data.timestamp, 
                        value: data.value 
                    }];
                    return newData.slice(-20);
                });
            } else if (data.type === 'light') {
                setSensorData(prev => ({ ...prev, light: data.value }));
                setLightData(prev => {
                    const newData = [...prev, { 
                        timestamp: data.timestamp, 
                        value: data.value 
                    }];
                    return newData.slice(-20);
                });
            } else if (data.type === 'dust') {
                setSensorData(prev => ({ ...prev, dust: data.value }));
                setDustData(prev => {
                    const newData = [...prev, { 
                        timestamp: data.timestamp, 
                        value: data.value 
                    }];
                    return newData.slice(-20);
                });
            }
        });

        return unsubscribe;
    }, [onSensorData, chartDataLoaded]);

    // Lắng nghe device status từ socket
    useEffect(() => {
        const unsubscribe = onDeviceStatus((statusUpdate) => {
            console.log('📡 Device status update:', statusUpdate);
            
            // Update device status trong danh sách
            setDevices(prev => prev.map(device => 
                device.id === statusUpdate.device_id
                    ? { ...device, status: statusUpdate.status }
                    : device
            ));
        });

        return unsubscribe;
    }, [onDeviceStatus]);

    // Fetch danh sách devices
    const fetchDevices = async () => {
        try {
            setLoading(true);
            const response = await deviceService.getAllDevicesInfo();
            setDevices(response.data || []);
        } catch (error) {
            console.error('❌ Error fetching devices:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle toggle device
    const handleToggleDevice = async (deviceId, currentStatus) => {
        try {
            // Optimistic update
            setDevices(prev => prev.map(device => 
                device.id === deviceId
                    ? { ...device, status: 2 } // 2 = waiting
                    : device
            ));

            // Call API
            const response = await deviceService.toggleStatus(deviceId);
            
            console.log('✅ Device toggled:', response);
            
            // Update sẽ được nhận qua socket
        } catch (error) {
            console.error('❌ Error toggling device:', error);
            // Revert về trạng thái cũ nếu lỗi
            setDevices(prev => prev.map(device => 
                device.id === deviceId
                    ? { ...device, status: currentStatus }
                    : device
            ));
        }
    };

    // Map status number to string
    const getDeviceState = (status) => {
        if (status === 1) return 'on';
        if (status === 0) return 'off';
        return 'waiting';
    };

    return (
        <MainLayout>
            {/* Socket Connection Status */}
            <div className="mb-4 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected() ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                    {isConnected() ? 'Connected to server' : 'Disconnected'}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - InforCard và ToggleCards */}
                <div className="space-y-6">
                    {/* InforCard với realtime data */}
                    <InforCard 
                        temperature={sensorData.temperature} 
                        humidity={sensorData.humidity} 
                        light={sensorData.light} 
                        dust={sensorData.dust} 
                    />

                    {/* Grid 2x2 ToggleCards */}
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Loading devices...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {devices.map((device) => (
                                <ToggleCard 
                                    key={`${device.id}-${device.status}`}
                                    deviceName={device.name} 
                                    initialState={getDeviceState(device.status)}
                                    onToggle={() => handleToggleDevice(device.id, device.status)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column - Charts với realtime data */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Chart 1 - Ánh sáng & Bụi mịn */}
                    <Chart 
                        data1={lightData} 
                        data2={dustData} 
                        color1="#fbbf24" 
                        color2="#9ca3af" 
                        label1="Ánh sáng" 
                        label2="Bụi mịn" 
                        unit1="lux" 
                        unit2="PM2.5" 
                        min1={0} 
                        max1={700} 
                        min2={0} 
                        max2={100} 
                        title="Ánh sáng & bụi mịn" 
                        subtitle="Light Intensity & Dust trends (Real-time)" 
                    />

                    {/* Chart 2 - Nhiệt độ & Độ ẩm */}
                    <Chart 
                        data1={temperatureData} 
                        data2={humidityData}
                        color1="#22c55e" 
                        color2="blue" 
                        label1="Nhiệt độ"
                        label2="Độ ẩm"
                        unit1="°C"
                        unit2="%"
                        min1={20}
                        max1={30}
                        min2={40}
                        max2={90}
                        title="Nhiệt độ & độ ẩm"
                        subtitle="Temperature & Humidity trends (Real-time)"
                    />
                </div>
            </div>
        </MainLayout>
    );
}