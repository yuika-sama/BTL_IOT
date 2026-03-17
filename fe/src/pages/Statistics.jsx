import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout.jsx';
import { Bell, Power, Activity, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { alertService, actionHistoryService } from '../services';

export default function Statistics() {
    const [alertCount, setAlertCount] = useState({
        total_count: 0,
        high_count: 0,
        medium_count: 0,
        low_count: 0,
        normal_count: 0
    });
    
    const [actionCount, setActionCount] = useState({
        on_count: 0,
        off_count: 0
    });

    const [alertCountByDays, setAlertCountByDays] = useState([]);
    const [actionCountByDays, setActionCountByDays] = useState([]);
    const [selectedDays, setSelectedDays] = useState(7);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const toNumber = (value) => Number(value || 0);

    const normalizeAlertDays = (items = []) => {
        return items.map((item) => ({
            ...item,
            total_count: toNumber(item.total_count),
            high_count: toNumber(item.high_count),
            medium_count: toNumber(item.medium_count),
            low_count: toNumber(item.low_count),
            normal_count: toNumber(item.normal_count)
        }));
    };

    const normalizeActionDays = (items = []) => {
        return items.map((item) => ({
            ...item,
            on_count: toNumber(item.on_count),
            off_count: toNumber(item.off_count)
        }));
    };

    // Fetch data
    useEffect(() => {
        fetchStatistics();
        
        // Refresh every minute
        const interval = setInterval(fetchStatistics, 60000);
        
        return () => clearInterval(interval);
    }, [selectedDays]);

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Gọi API song song
            const [
                alertDailyResponse, 
                actionDailyResponse,
                alertByDaysResponse,
                actionByDaysResponse
            ] = await Promise.all([
                alertService.getDailyCount(),
                actionHistoryService.getDailyCount(),
                alertService.getCountByDays(selectedDays),
                actionHistoryService.getCountByDays(selectedDays)
            ]);

            if (alertDailyResponse.success) {
                setAlertCount(alertDailyResponse.data);
            }
            
            if (actionDailyResponse.success) {
                setActionCount(actionDailyResponse.data);
            }

            if (alertByDaysResponse.success) {
                setAlertCountByDays(normalizeAlertDays(alertByDaysResponse.data));
            }

            if (actionByDaysResponse.success) {
                setActionCountByDays(normalizeActionDays(actionByDaysResponse.data));
            }
        } catch (err) {
            console.error('Error fetching statistics:', err);
            setError('Không thể tải thống kê');
        } finally {
            setLoading(false);
        }
    };

    const getCurrentDate = () => {
        const date = new Date();
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';

        // Avoid timezone shift for YYYY-MM-DD date-only strings.
        const date = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
            ? new Date(`${dateStr}T00:00:00`)
            : new Date(dateStr);

        if (Number.isNaN(date.getTime())) {
            return '';
        }

        const day = date.getDate();
        const month = date.getMonth() + 1;
        return `${day}/${month}`;
    };

    const getTotalAlertsByDays = () => {
        return alertCountByDays.reduce((sum, day) => sum + toNumber(day.total_count), 0);
    };

    const getTotalActionsByDays = () => {
        return actionCountByDays.reduce((sum, day) => {
            return sum + Number(day.on_count || 0) + Number(day.off_count || 0);
        }, 0);
    };

    const getMaxValue = (data, key) => {
        return Math.max(...data.map((item) => toNumber(item[key])), 0);
    };

    if (loading && alertCount.total_count === 0 && actionCount.on_count + actionCount.off_count === 0) {
        return (
            <MainLayout>
                <div className="container mx-auto px-4 py-8">
                    <div className="flex justify-center items-center py-20">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-ping opacity-20"></div>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Thống kê hệ thống
                            </h1>
                            <p className="text-gray-600">
                                Theo dõi hoạt động và cảnh báo của hệ thống IoT
                            </p>
                        </div>
                        <button 
                            onClick={fetchStatistics}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
                            title="Làm mới"
                        >
                            <Activity size={20} />
                            <span>Làm mới</span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                        {error}
                    </div>
                )}

                {/* Today's Statistics */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar size={24} className="text-blue-500" />
                        <h2 className="text-xl font-bold text-gray-800">Thống kê hôm nay</h2>
                        <span className="text-sm text-gray-500">({getCurrentDate()})</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Alert Statistics Today */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                    <Bell size={24} className="text-orange-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Cảnh báo</h3>
                                    <p className="text-sm text-gray-500">Alerts hôm nay</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="text-4xl font-bold text-orange-600 mb-1">
                                    {alertCount.total_count}
                                </div>
                                <div className="text-sm text-gray-600">Tổng số cảnh báo</div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-gray-700">Nghiêm trọng</span>
                                    </div>
                                    <span className="text-lg font-bold text-red-600">{alertCount.high_count}</span>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-gray-700">Cảnh báo</span>
                                    </div>
                                    <span className="text-lg font-bold text-yellow-600">{alertCount.medium_count}</span>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-gray-700">Thông tin</span>
                                    </div>
                                    <span className="text-lg font-bold text-blue-600">{alertCount.low_count}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Statistics Today */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <Power size={24} className="text-green-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Bật/Tắt thiết bị</h3>
                                    <p className="text-sm text-gray-500">Actions hôm nay</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="text-4xl font-bold text-green-600 mb-1">
                                    {actionCount.on_count + actionCount.off_count}
                                </div>
                                <div className="text-sm text-gray-600">Tổng số lượt bật/tắt</div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-gray-700">Bật</span>
                                    </div>
                                    <span className="text-lg font-bold text-green-600">{actionCount.on_count}</span>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-gray-700">Tắt</span>
                                    </div>
                                    <span className="text-lg font-bold text-gray-600">{actionCount.off_count}</span>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-gray-700">Tổng số</span>
                                    </div>
                                    <span className="text-lg font-bold text-blue-600">{actionCount.on_count + actionCount.off_count}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Period Selector */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={24} className="text-blue-500" />
                        <h2 className="text-xl font-bold text-gray-800">Xu hướng theo thời gian</h2>
                    </div>

                    <div className="flex gap-2 mb-4">
                        {[7, 14, 30].map(days => (
                            <button
                                key={days}
                                onClick={() => setSelectedDays(days)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    selectedDays === days
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                }`}
                            >
                                {days} ngày
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Alert Trend */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-800">Cảnh báo {selectedDays} ngày</h3>
                                <div className="text-2xl font-bold text-orange-600">
                                    {getTotalAlertsByDays()}
                                </div>
                            </div>

                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {alertCountByDays.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        Chưa có dữ liệu
                                    </div>
                                ) : (
                                    alertCountByDays.map((day, index) => {
                                        const maxTotal = getMaxValue(alertCountByDays, 'total_count');
                                        const percentage = maxTotal > 0 ? (day.total_count / maxTotal) * 100 : 0;
                                        
                                        return (
                                            <div key={index} className="space-y-1">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600 font-medium">
                                                        {formatDate(day.date)}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {/* <span className="text-xs text-red-600">H:{day.high_count || 0}</span>
                                                        <span className="text-xs text-yellow-600">M:{day.medium_count || 0}</span>
                                                        <span className="text-xs text-blue-600">L:{day.low_count || 0}</span> */}
                                                        <span className="font-bold text-gray-900">{day.total_count || 0}</span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Action Trend */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-800">Bật/Tắt {selectedDays} ngày</h3>
                                <div className="text-2xl font-bold text-green-600">
                                    {getTotalActionsByDays()}
                                </div>
                            </div>

                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {actionCountByDays.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        Chưa có dữ liệu
                                    </div>
                                ) : (
                                    actionCountByDays.map((day, index) => {
                                        const dayTotal = Number(day.on_count || 0) + Number(day.off_count || 0);
                                        const maxTotal = Math.max(
                                            ...actionCountByDays.map((item) => Number(item.on_count || 0) + Number(item.off_count || 0)),
                                            0
                                        );
                                        const percentage = maxTotal > 0 ? (dayTotal / maxTotal) * 100 : 0;
                                        
                                        return (
                                            <div key={index} className="space-y-1">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600 font-medium">
                                                        {formatDate(day.date)}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-green-600">ON:{day.on_count || 0}</span>
                                                        <span className="text-xs text-gray-600">OFF:{day.off_count || 0}</span>
                                                        <span className="font-bold text-gray-900">{dayTotal}</span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 shadow-lg border border-blue-100">
                    <div className="flex items-center gap-3 mb-4">
                        <BarChart3 size={24} className="text-blue-500" />
                        <h3 className="text-lg font-bold text-gray-800">Tổng quan {selectedDays} ngày</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-orange-600">{getTotalAlertsByDays()}</div>
                            <div className="text-xs text-gray-600 mt-1">Tổng cảnh báo</div>
                        </div>
                        <div className="bg-white rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{getTotalActionsByDays()}</div>
                            <div className="text-xs text-gray-600 mt-1">Tổng bật/tắt</div>
                        </div>
                        <div className="bg-white rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {alertCountByDays.length > 0 
                                    ? Math.round(getTotalAlertsByDays() / alertCountByDays.length) 
                                    : 0}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">TB cảnh báo/ngày</div>
                        </div>
                        <div className="bg-white rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                {actionCountByDays.length > 0 
                                    ? Math.round(getTotalActionsByDays() / actionCountByDays.length) 
                                    : 0}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">TB bật/tắt/ngày</div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
