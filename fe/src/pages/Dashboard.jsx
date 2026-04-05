import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../components/MainLayout.jsx';
import InforCard from '../components/InforCard.jsx';
import ToggleCard from '../components/ToggleCard.jsx';
import Chart from '../components/Chart.jsx';
import { useSocket } from '../hooks/useSocket.jsx';
import { deviceService, dataSensorService } from '../services';
import { formatName, formatNumber } from '../utils/formatter.js';
import { SENSOR_THEME, toRgba, normalizeSensorLevel, createBackgroundTheme } from '../utils/themeUtils.js';
import { getDeviceDisplayName, getDeviceSensorKey, getDeviceState } from '../utils/mappings.js';

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
    const [sensorPulse, setSensorPulse] = useState({
        temperature: false,
        humidity: false,
        light: false,
        gas: false
    });
    const sensorDataRef = useRef(sensorData);
    const pulseTimeoutsRef = useRef({});

    // Socket hook
    const { onSensorData, onDeviceStatus, on, isConnected } = useSocket();
    const [connectionState, setConnectionState] = useState({
        socketConnected: false,
        mqttConnected: false,
        hardwareConnected: false
    });

    // Fetch danh sách devices và dữ liệu ban đầu cho biểu đồ khi mount
    useEffect(() => {
        fetchDevices();
        fetchInitialChartData();
    }, []);

    useEffect(() => {
        setConnectionState((prev) => ({
            ...prev,
            socketConnected: isConnected()
        }));

        const handleSocketLost = () => {
            setConnectionState({
                socketConnected: false,
                mqttConnected: false,
                hardwareConnected: false
            });
        };

        const unsubscribeConnectionStatus = on('connection_status', (statusPayload) => {
            setConnectionState({
                socketConnected: isConnected(),
                mqttConnected: Boolean(statusPayload?.mqttConnected),
                hardwareConnected: Boolean(statusPayload?.hardwareConnected)
            });
        });

        const unsubscribeConnect = on('connect', () => {
            setConnectionState((prev) => ({
                ...prev,
                socketConnected: true
            }));
        });

        const unsubscribeDisconnect = on('disconnect', handleSocketLost);
        const unsubscribeConnectError = on('connect_error', handleSocketLost);

        return () => {
            unsubscribeConnectionStatus();
            unsubscribeConnect();
            unsubscribeDisconnect();
            unsubscribeConnectError();
        };
    }, [on, isConnected]);

    useEffect(() => {
        sensorDataRef.current = sensorData;
    }, [sensorData]);

    useEffect(() => {
        return () => {
            Object.values(pulseTimeoutsRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
        };
    }, []);


    const triggerSensorPulse = (sensorKey) => {
        setSensorPulse((prev) => ({
            ...prev,
            [sensorKey]: true
        }));

        if (pulseTimeoutsRef.current[sensorKey]) {
            clearTimeout(pulseTimeoutsRef.current[sensorKey]);
        }

        pulseTimeoutsRef.current[sensorKey] = setTimeout(() => {
            setSensorPulse((prev) => ({
                ...prev,
                [sensorKey]: false
            }));
        }, 750);
    };

    const updateSensorValueAndPulse = (sensorKey, nextValue) => {
        const normalizedValue = Number(nextValue);
        if (Number.isNaN(normalizedValue)) {
            return;
        }

        const previousValue = Number(sensorDataRef.current?.[sensorKey] ?? 0);
        if (Math.abs(previousValue - normalizedValue) >= 0.1) {
            triggerSensorPulse(sensorKey);
        }

        setSensorData((prev) => ({
            ...prev,
            [sensorKey]: normalizedValue
        }));
    };

    const appendChartDataPoint = (setSeries, timestamp, value) => {
        setSeries((prev) => {
            const newData = [...prev, {
                timestamp,
                value
            }];

            return newData.slice(-20);
        });
    };

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
            const numericValue = Number(data.value);
            if (Number.isNaN(numericValue)) {
                return;
            }
            
            // Cập nhật current values
            if (data.type === 'temperature') {
                updateSensorValueAndPulse('temperature', numericValue);
                appendChartDataPoint(setTemperatureData, data.timestamp, numericValue);
            } else if (data.type === 'humidity') {
                updateSensorValueAndPulse('humidity', numericValue);
                appendChartDataPoint(setHumidityData, data.timestamp, numericValue);
            } else if (data.type === 'light') {
                updateSensorValueAndPulse('light', numericValue);
                appendChartDataPoint(setLightData, data.timestamp, numericValue);
            } else if (data.type === 'gas' || data.type === 'dust') {
                updateSensorValueAndPulse('gas', numericValue);
                appendChartDataPoint(setGasData, data.timestamp, numericValue);
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
    const handleToggleDevice = async (deviceId, currentValue) => {
        const canControlDevices = connectionState.socketConnected && connectionState.mqttConnected && connectionState.hardwareConnected;
        if (!canControlDevices) {
            window.alert('Mất kết nối tới thiết bị. Vui lòng thử lại sau.');
            return;
        }

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

                if (response?.data?.status === 'failed' && response?.message) {
                    window.alert(response.message);
                }
            }
        } catch (error) {
            console.error('❌ Error toggling device:', error);
            window.alert('Không thể kết nối tới backend. Vui lòng thử lại.');
            // Revert về trạng thái cũ nếu lỗi
            setDevices(prev => prev.map(device => 
                device.id === deviceId
                    ? { ...device, value: currentValue, status: 'failed' }
                    : device
            ));
        }
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
    const sensorLevels = {
        temperature: normalizeSensorLevel(sensorData.temperature, 0, 50),
        humidity: normalizeSensorLevel(sensorData.humidity, 0, 100),
        light: normalizeSensorLevel(sensorData.light, 0, 100),
        gas: normalizeSensorLevel(sensorData.gas, 0, 100)
    };

    const canControlDevices = connectionState.socketConnected && connectionState.mqttConnected && connectionState.hardwareConnected;
    const connectionMessage = !connectionState.socketConnected
        ? 'Mất kết nối Socket tới backend'
        : (!connectionState.mqttConnected
            ? 'Mất kết nối MQTT tới backend'
            : (connectionState.hardwareConnected ? 'Đã kết nối với server' : 'Mất kết nối tới thiết bị'));
    const formattedDevices = (Array.isArray(devices) ? devices : []).map((device) => ({
        ...device,
        sensorKey: getDeviceSensorKey(device.name),
        displayName: formatName(String(getDeviceDisplayName(device.name || 'Thiết bị')))
    }));

    const backgroundTheme = createBackgroundTheme(sensorLevels);

    const lightChartColor = toRgba(SENSOR_THEME.light.hex, 0.68 + sensorLevels.light * 0.32);
    const gasChartColor = toRgba(SENSOR_THEME.gas.hex, 0.62 + sensorLevels.gas * 0.3);
    const tempChartColor = toRgba(SENSOR_THEME.temperature.hex, 0.7 + sensorLevels.temperature * 0.3);
    const humChartColor = toRgba(SENSOR_THEME.humidity.hex, 0.68 + sensorLevels.humidity * 0.32);

    const chartStyleLightGas = {
        border: `1px solid ${toRgba(SENSOR_THEME.light.hex, 0.16 + sensorLevels.light * 0.24)}`,
        background: `linear-gradient(150deg, rgba(255,255,255,0.96), ${toRgba(SENSOR_THEME.light.hex, 0.06 + sensorLevels.light * 0.12)})`,
        boxShadow: `
            0 12px 28px rgba(15,23,42,0.08),
            0 0 ${14 + sensorLevels.light * 18}px ${toRgba(SENSOR_THEME.light.hex, 0.12 + (sensorPulse.light ? 0.12 : 0))},
            0 0 ${12 + sensorLevels.gas * 16}px ${toRgba(SENSOR_THEME.gas.hex, 0.1 + (sensorPulse.gas ? 0.1 : 0))}
        `,
        transform: sensorPulse.light || sensorPulse.gas ? 'translateY(-2px)' : 'translateY(0)'
    };

    const chartStyleTempHum = {
        border: `1px solid ${toRgba(SENSOR_THEME.temperature.hex, 0.16 + sensorLevels.temperature * 0.24)}`,
        background: `linear-gradient(150deg, rgba(255,255,255,0.96), ${toRgba(SENSOR_THEME.humidity.hex, 0.06 + sensorLevels.humidity * 0.12)})`,
        boxShadow: `
            0 12px 28px rgba(15,23,42,0.08),
            0 0 ${14 + sensorLevels.temperature * 18}px ${toRgba(SENSOR_THEME.temperature.hex, 0.12 + (sensorPulse.temperature ? 0.12 : 0))},
            0 0 ${14 + sensorLevels.humidity * 18}px ${toRgba(SENSOR_THEME.humidity.hex, 0.12 + (sensorPulse.humidity ? 0.12 : 0))}
        `,
        transform: sensorPulse.temperature || sensorPulse.humidity ? 'translateY(-2px)' : 'translateY(0)'
    };



    return (
        <MainLayout backgroundTheme={backgroundTheme}>
            <div className="relative overflow-hidden rounded-[2rem] p-2">
                {/* <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full transition-all duration-700" style={temperatureAmbientStyle}></div>
                    <div className="absolute -top-16 right-8 w-72 h-72 rounded-full transition-all duration-700" style={humidityAmbientStyle}></div>
                    <div className="absolute top-1/3 -right-12 w-96 h-96 rounded-full transition-all duration-700" style={lightAmbientStyle}></div>
                    <div className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full transition-all duration-700" style={gasAmbientStyle}></div>
                </div> */}

                <div className="relative z-10">
                    {/* Socket Connection Status */}
                    <div className="mb-6 flex items-center gap-3 bg-white px-5 py-1 rounded-2xl shadow-md border border-gray-100 w-fit">
                        <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            canControlDevices ? 'bg-green-500 shadow-lg shadow-green-200 animate-pulse' : 'bg-red-500 shadow-lg shadow-red-200'
                        }`}></div>
                        <span className={`text-sm font-medium ${
                            canControlDevices ? 'text-green-700' : 'text-red-700'
                        }`}>
                            {connectionMessage}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - InforCard và ToggleCards */}
                        <div className="space-y-6">
                            {/* InforCard */}
                            <div className="rounded-3xl">
                                <InforCard 
                                    temperature={formattedSensorData.temperature} 
                                    humidity={formattedSensorData.humidity} 
                                    light={formattedSensorData.light} 
                                    gas={formattedSensorData.gas}
                                />
                            </div>

                            {loading ? (
                                <div className="flex flex-col justify-center items-center py-12 bg-white rounded-3xl shadow-lg border border-gray-100">
                                    <div className="relative">
                                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                        <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-400 rounded-full animate-ping opacity-20"></div>
                                    </div>
                                    <p className="mt-4 text-gray-600 font-medium">Đang tải thiết bị...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    {formattedDevices.map((device) => {
                                        return (
                                        <ToggleCard 
                                            key={device.id}
                                            deviceName={device.name.charAt(0).toUpperCase() + device.name.slice(1)}
                                            initialState={getDeviceState(device.value, device.status)}
                                            isConnected={canControlDevices && device.is_connected !== false}
                                            onToggle={() => handleToggleDevice(device.id, device.value)}
                                        />
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Right Column - Charts với realtime data */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Chart 1 - Ánh sáng & Khí gas */}
                            <div className="rounded-3xl">
                                <Chart 
                                    data1={formattedLightData} 
                                    data2={formattedGasData} 
                                    color1={lightChartColor}
                                    color2={gasChartColor}
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
                                    containerStyle={chartStyleLightGas}
                                />
                            </div>

                            {/* Chart 2 - Nhiệt độ & Độ ẩm */}
                            <div className="rounded-3xl">
                                <Chart 
                                    data1={formattedTemperatureData} 
                                    data2={formattedHumidityData}
                                    color1={tempChartColor}
                                    color2={humChartColor}
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
                                    containerStyle={chartStyleTempHum}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}