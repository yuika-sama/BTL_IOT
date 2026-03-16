import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout.jsx';
import InforCard from '../components/InforCard.jsx';
import ToggleCard from '../components/ToggleCard.jsx';
import Chart from '../components/Chart.jsx';
import { useSocket } from '../hooks/useSocket.jsx';
import { deviceService, dataSensorService } from '../services';
import { formatName, formatNumber } from '../utils/formatter.js';

export default function Dashboard() {
    // State cho sensor data realtime
    const [sensorData, setSensorData] = useState({
        temperature: 0,
        humidity: 0,
        light: 0,
        gas: 0
    });

    // State cho chart data
    const [temperatureData, setTemperatureData] = useState([]);
    const [humidityData, setHumidityData] = useState([]);
    const [lightData, setLightData] = useState([]);
    const [gasData, setGasData] = useState([]);

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
            const [initialResponse, latestResponse] = await Promise.all([
                dataSensorService.getInitialChartData(20),
                dataSensorService.getLatestValues()
            ]);

            if (initialResponse?.success) {
                const temperature = initialResponse.data?.temperature || [];
                const humidity = initialResponse.data?.humidity || [];
                const light = initialResponse.data?.light || [];
                const gas = initialResponse.data?.gas || [];

                setTemperatureData(temperature);
                setHumidityData(humidity);
                setLightData(light);
                setGasData(gas);
            }

            if (latestResponse?.success) {
                setSensorData(prev => ({
                    ...prev,
                    temperature: latestResponse.data.temperature ?? prev.temperature,
                    humidity: latestResponse.data.humidity ?? prev.humidity,
                    light: latestResponse.data.light ?? prev.light,
                    gas: latestResponse.data.gas ?? prev.gas
                }));
            }

            setChartDataLoaded(true);
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
            } else if (data.type === 'gas' || data.type === 'dust') {
                setSensorData(prev => ({ ...prev, gas: data.value }));
                setGasData(prev => {
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
            
            // Update device trong danh sách
            setDevices(prev => prev.map(device => {
                if (device.id === statusUpdate.device_id) {
                    const updated = { 
                        ...device, 
                        value: statusUpdate.value !== undefined ? statusUpdate.value : device.value,
                        status: statusUpdate.status !== undefined ? statusUpdate.status : device.status,
                        is_connected: statusUpdate.is_connected !== undefined ? statusUpdate.is_connected : device.is_connected
                    };
                    console.log('🔄 Device updated:', {
                        id: device.id,
                        old: { value: device.value, status: device.status, is_connected: device.is_connected },
                        new: { value: updated.value, status: updated.status, is_connected: updated.is_connected }
                    });
                    return updated;
                }
                return device;
            }));
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
    const handleToggleDevice = async (deviceId, currentValue, currentStatus) => {
        try {
            // Optimistic update - set status to waiting
            setDevices(prev => prev.map(device => 
                device.id === deviceId
                    ? { ...device, status: 'waiting' }
                    : device
            ));

            // Call API
            const response = await deviceService.toggleStatus(deviceId);

            if (response?.success) {
                setDevices(prev => prev.map(device => 
                    device.id === deviceId
                        ? {
                            ...device,
                            value: response.data?.value ?? device.value,
                            status: response.data?.status ?? 'success'
                        }
                        : device
                ));
            }
        } catch (error) {
            console.error('❌ Error toggling device:', error);
            // Revert về trạng thái cũ nếu lỗi
            setDevices(prev => prev.map(device => 
                device.id === deviceId
                    ? { ...device, value: currentValue, status: 'failed' }
                    : device
            ));
        }
    };

    // Map value to state string (for ToggleCard)
    const getDeviceState = (value, status) => {
        // Use Number() to avoid string vs number comparison issues
        const numValue = Number(value);
        const state = status === 'waiting' ? 'waiting' :
                     numValue === 1 ? 'on' : 'off';
        console.log('🔍 getDeviceState:', { value, numValue, status, result: state });
        return state;
    };

    // Get device display name
    const getDeviceDisplayName = (deviceName) => {
        const names = {
            'dev_temp_led': 'Nhiệt độ',
            'dev_hum_led': 'Độ ẩm',
            'dev_ldr_led': 'Ánh sáng',
            'dev_dust_led': 'Bụi mịn',
        };
        return names[deviceName] || deviceName;
    };

    const formatDeviceDisplayName = (deviceName) => {
        const displayName = getDeviceDisplayName(deviceName || '');
        return formatName(String(displayName || 'Thiết bị'));
    };

    const normalizeChartSeries = (series = []) => {
        return (Array.isArray(series) ? series : [])
            .filter((item) => item?.timestamp)
            .map((item) => ({
                timestamp: item.timestamp,
                value: Number(item.value)
            }))
            .filter((item) => !Number.isNaN(item.value));
    };

    const formattedSensorData = {
        temperature: formatNumber(sensorData.temperature),
        humidity: formatNumber(sensorData.humidity),
        light: formatNumber(sensorData.light),
        gas: formatNumber(sensorData.gas)
    };

    const formattedTemperatureData = normalizeChartSeries(temperatureData);
    const formattedHumidityData = normalizeChartSeries(humidityData);
    const formattedLightData = normalizeChartSeries(lightData);
    const formattedGasData = normalizeChartSeries(gasData);
    const formattedDevices = (Array.isArray(devices) ? devices : []).map((device) => ({
        ...device,
        displayName: formatDeviceDisplayName(device.name)
    }));


    // console.log('🔄 Dashboard rendered with devices:', devices);

    return (
        <MainLayout>
            {/* Socket Connection Status */}
            <div className="mb-6 flex items-center gap-3 bg-white px-5 py-1 rounded-2xl shadow-md border border-gray-100 w-fit">
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    isConnected() ? 'bg-green-500 shadow-lg shadow-green-200 animate-pulse' : 'bg-red-500 shadow-lg shadow-red-200'
                }`}></div>
                <span className={`text-sm font-medium ${
                    isConnected() ? 'text-green-700' : 'text-red-700'
                }`}>
                    {isConnected() ? 'Đã kết nối với server' : 'Mất kết nối'}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - InforCard và ToggleCards */}
                <div className="space-y-6">
                    {/* InforCard với realtime data */}
                    <InforCard 
                        temperature={formattedSensorData.temperature} 
                        humidity={formattedSensorData.humidity} 
                        light={formattedSensorData.light} 
                        gas={formattedSensorData.gas} 
                    />

                    {/* Grid 2x2 ToggleCards */}
                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-12 bg-white rounded-3xl shadow-lg border border-gray-100">
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-400 rounded-full animate-ping opacity-20"></div>
                            </div>
                            <p className="mt-4 text-gray-600 font-medium">Loading devices...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {formattedDevices.map((device) => (
                                <ToggleCard 
                                    key={device.id}
                                    deviceName={device.name.charAt(0).toUpperCase() + device.name.slice(1)}
                                    initialState={getDeviceState(device.value, device.status)}
                                    isConnected={device.is_connected !== false}
                                    onToggle={() => handleToggleDevice(device.id, device.value, device.status)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column - Charts với realtime data */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Chart 1 - Ánh sáng & Bụi mịn */}
                    <Chart 
                        data1={formattedLightData} 
                        data2={formattedGasData} 
                        color1="#fbbf24" 
                        color2="#9ca3af" 
                        label1="Ánh sáng" 
                        label2="Khí gas" 
                        unit1="%(lux)" 
                        unit2="%(ppm)" 
                        min1={0} 
                        max1={100} 
                        min2={0} 
                        max2={100} 
                        title="Ánh sáng & khí gas" 
                        subtitle="Light Intensity & Gas Levels" 
                    />

                    {/* Chart 2 - Nhiệt độ & Độ ẩm */}
                    <Chart 
                        data1={formattedTemperatureData} 
                        data2={formattedHumidityData}
                        color1="#22c55e" 
                        color2="blue" 
                        label1="Nhiệt độ"
                        label2="Độ ẩm"
                        unit1="°C"
                        unit2="%"
                        min1={0}
                        max1={100}
                        min2={0}
                        max2={100}
                        title="Nhiệt độ & độ ẩm"
                        subtitle="Temperature & Humidity trends"
                    />
                </div>
            </div>
        </MainLayout>
    );
}