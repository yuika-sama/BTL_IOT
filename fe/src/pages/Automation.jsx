import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout.jsx';
import { useSocket } from '../hooks/useSocket.jsx';
import { deviceService } from '../services';
import { Zap, ZapOff, Settings, Lightbulb } from 'lucide-react';

export default function Automation() {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const { onDeviceStatus, isConnected } = useSocket();

    // Fetch danh sách devices khi mount
    useEffect(() => {
        fetchDevices();
    }, []);

    // Lắng nghe device status từ socket
    useEffect(() => {
        const unsubscribe = onDeviceStatus((statusUpdate) => {
            console.log('📡 Device status update:', statusUpdate);
            
            // Update device trong danh sách
            setDevices(prev => prev.map(device => 
                device.id === statusUpdate.device_id
                    ? { 
                        ...device,
                        value: statusUpdate.value !== undefined ? statusUpdate.value : device.value,
                        status: statusUpdate.status !== undefined ? statusUpdate.status : device.status,
                        auto_toggle: statusUpdate.auto_toggle !== undefined ? statusUpdate.auto_toggle : device.auto_toggle
                    }
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

    // Handle toggle automation mode
    const handleToggleAutoMode = async (deviceId, currentAutoMode) => {
        try {
            // Optimistic update
            setDevices(prev => prev.map(device => 
                device.id === deviceId
                    ? { ...device, auto_toggle: currentAutoMode === 1 ? 0 : 1 }
                    : device
            ));

            // Call API
            const response = await deviceService.toggleAutoMode(deviceId);
            
            console.log('✅ Automation mode toggled:', response);
        } catch (error) {
            console.error('❌ Error toggling automation mode:', error);
            // Revert về trạng thái cũ nếu lỗi
            setDevices(prev => prev.map(device => 
                device.id === deviceId
                    ? { ...device, auto_toggle: currentAutoMode }
                    : device
            ));
        }
    };

    // Map device name to icon and color
    const getDeviceIcon = (deviceName) => {
        const icons = {
            'dev_temp_led': { icon: <Lightbulb size={32} />, color: 'text-red-500' },
            'dev_hum_led': { icon: <Lightbulb size={32} />, color: 'text-blue-500' },
            'dev_ldr_led': { icon: <Lightbulb size={32} />, color: 'text-yellow-500' },
            'dev_dust_led': { icon: <Lightbulb size={32} />, color: 'text-gray-500' },
        };
        return icons[deviceName] || { icon: <Settings size={32} />, color: 'text-gray-400' };
    };

    // Get device display name
    const getDeviceDisplayName = (deviceName) => {
        const names = {
            'dev_temp_led': 'Nhiệt độ LED',
            'dev_hum_led': 'Độ ẩm LED',
            'dev_ldr_led': 'Ánh sáng LED',
            'dev_dust_led': 'Bụi mịn LED',
        };
        return names[deviceName] || deviceName;
    };

    return (
        <MainLayout>
            {/* Socket Connection Status */}
            <div className="mb-6 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected() ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                    {isConnected() ? 'Connected to server' : 'Disconnected'}
                </span>
            </div>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản lý Tự động hóa</h1>
                <p className="text-gray-600">Bật/tắt chế độ tự động cho từng thiết bị</p>
            </div>

            {/* Devices Grid */}
            {loading ? (
                <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải danh sách thiết bị...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {devices.map((device) => {
                        const { icon, color } = getDeviceIcon(device.name);
                        const isAuto = device.auto_toggle === 1;
                        
                        return (
                            <div 
                                key={device.id}
                                className={`rounded-2xl p-6 shadow-lg transition-all duration-300 border-2 ${
                                    isAuto 
                                        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-400' 
                                        : 'bg-white border-gray-200'
                                }`}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`${color}`}>
                                            {icon}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800">
                                                {getDeviceDisplayName(device.name)}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Trạng thái: {device.value === 1 ? 'Bật' : 'Tắt'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Automation Toggle */}
                                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                                    <div className="flex items-center gap-3">
                                        {isAuto ? (
                                            <Zap className="text-blue-500" size={24} />
                                        ) : (
                                            <ZapOff className="text-gray-400" size={24} />
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-800">
                                                {isAuto ? 'Chế độ Tự động' : 'Chế độ Thủ công'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {isAuto 
                                                    ? 'Thiết bị hoạt động dựa trên cảm biến' 
                                                    : 'Điều khiển thiết bị thủ công'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Toggle Button */}
                                    <button
                                        onClick={() => handleToggleAutoMode(device.id, device.auto_toggle)}
                                        className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${
                                            isAuto ? 'bg-blue-500' : 'bg-gray-300'
                                        }`}
                                    >
                                        <div 
                                            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                                                isAuto ? 'translate-x-8' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Info Box */}
                                {isAuto && (
                                    <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
                                        <p className="text-sm text-blue-800">
                                            ⚡ Tự động điều chỉnh dựa trên ngưỡng cảm biến
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Info Section */}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Settings size={20} className="text-blue-600" />
                    Về chế độ tự động hóa
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span><strong>Chế độ Tự động:</strong> Thiết bị sẽ bật/tắt tự động dựa trên giá trị cảm biến và ngưỡng đã cài đặt</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span><strong>Chế độ Thủ công:</strong> Bạn điều khiển hoàn toàn thiết bị từ Dashboard</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>Khi bạn điều khiển thiết bị thủ công, chế độ tự động sẽ tự động tắt</span>
                    </li>
                </ul>
            </div>
        </MainLayout>
    );
}
