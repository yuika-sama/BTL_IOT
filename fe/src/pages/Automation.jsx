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
            <div className="mb-6 flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-md border border-gray-100 w-fit">
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    isConnected() ? 'bg-green-500 shadow-lg shadow-green-200 animate-pulse' : 'bg-red-500 shadow-lg shadow-red-200'
                }`}></div>
                <span className="text-sm font-medium ${
                    isConnected() ? 'text-green-700' : 'text-red-700'
                }">
                    {isConnected() ? 'Đã kết nối với server' : 'Mất kết nối'}
                </span>
            </div>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">Quản lý Tự động hóa</h1>
                <p className="text-gray-600 text-lg">Bật/tắt chế độ tự động cho từng thiết bị</p>
            </div>

            {/* Devices Grid */}
            {loading ? (
                <div className="flex flex-col justify-center items-center py-24 bg-white rounded-3xl shadow-lg border border-gray-100">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-ping opacity-20"></div>
                    </div>
                    <p className="mt-6 text-gray-600 font-medium text-lg">Đang tải danh sách thiết bị...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {devices.map((device) => {
                        const { icon, color } = getDeviceIcon(device.name);
                        const isAuto = device.auto_toggle === 1;
                        
                        return (
                            <div 
                                key={device.id}
                                className={`rounded-3xl p-7 shadow-lg transition-all duration-300 border-2 hover:shadow-2xl ${
                                    isAuto 
                                        ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 border-blue-300 shadow-blue-100' 
                                        : 'bg-white border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl bg-white shadow-md ${color}`}>
                                            {icon}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">
                                                {getDeviceDisplayName(device.name)}
                                            </h3>
                                            <p className="text-sm font-medium mt-1 ${
                                                device.value === 1 ? 'text-green-600' : 'text-gray-500'
                                            }">
                                                Trạng thái: {device.value === 1 ? 'Bật' : 'Tắt'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Automation Toggle */}
                                <div className="flex items-center justify-between p-5 bg-white rounded-2xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${
                                            isAuto ? 'bg-blue-100' : 'bg-gray-100'
                                        }`}>
                                            {isAuto ? (
                                                <Zap className="text-blue-600" size={24} />
                                            ) : (
                                                <ZapOff className="text-gray-500" size={24} />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {isAuto ? 'Chế độ Tự động' : 'Chế độ Thủ công'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {isAuto 
                                                    ? 'Thiết bị hoạt động dựa trên cảm biến' 
                                                    : 'Điều khiển thiết bị thủ công'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Toggle Button */}
                                    <button
                                        onClick={() => handleToggleAutoMode(device.id, device.auto_toggle)}
                                        className={`relative w-16 h-8 rounded-full transition-all duration-300 shadow-md ${
                                            isAuto ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-200' : 'bg-gray-300 shadow-gray-200'
                                        }`}
                                    >
                                        <div 
                                            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                                                isAuto ? 'translate-x-8' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Info Box */}
                                {isAuto && (
                                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl border-2 border-blue-200 shadow-sm">
                                        <p className="text-sm font-medium text-blue-900 flex items-center gap-2">
                                            <Zap size={16} className="text-blue-600" />
                                            Tự động điều chỉnh dựa trên ngưỡng cảm biến
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Info Section */}
            <div className="mt-8 p-7 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl border-2 border-blue-200 shadow-lg">
                <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-xl">
                        <Settings size={20} className="text-blue-600" />
                    </div>
                    Về chế độ tự động hóa
                </h3>
                <ul className="space-y-3 text-sm text-gray-700">
                    <li className="flex items-start gap-3 p-3 bg-white rounded-xl shadow-sm">
                        <span className="text-blue-600 mt-1 font-bold">•</span>
                        <span><strong className="text-gray-900">Chế độ Tự động:</strong> Thiết bị sẽ bật/tắt tự động dựa trên giá trị cảm biến và ngưỡng đã cài đặt</span>
                    </li>
                    <li className="flex items-start gap-3 p-3 bg-white rounded-xl shadow-sm">
                        <span className="text-blue-600 mt-1 font-bold">•</span>
                        <span><strong className="text-gray-900">Chế độ Thủ công:</strong> Bạn điều khiển hoàn toàn thiết bị từ Dashboard</span>
                    </li>
                    <li className="flex items-start gap-3 p-3 bg-white rounded-xl shadow-sm">
                        <span className="text-blue-600 mt-1 font-bold">•</span>
                        <span>Khi bạn điều khiển thiết bị thủ công, chế độ tự động sẽ tự động tắt</span>
                    </li>
                </ul>
            </div>
        </MainLayout>
    );
}
