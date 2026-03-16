import React, { useState, useEffect } from 'react';
import { Bell, Power, AlertTriangle, Activity } from 'lucide-react';
import { alertService, actionHistoryService } from '../services';

export default function DailyStatsCard() {
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

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch daily counts
    useEffect(() => {
        fetchDailyCounts();
        
        // Refresh every minute
        const interval = setInterval(fetchDailyCounts, 60000);
        
        return () => clearInterval(interval);
    }, []);

    const fetchDailyCounts = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Gọi API song song
            const [alertResponse, actionResponse] = await Promise.all([
                alertService.getDailyCount(),
                actionHistoryService.getDailyCount()
            ]);

            if (alertResponse.success) {
                setAlertCount(alertResponse.data);
            }
            
            if (actionResponse.success) {
                setActionCount(actionResponse.data);
            }
        } catch (err) {
            console.error('Error fetching daily counts:', err);
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

    if (loading && alertCount.total_count === 0 && actionCount.on_count + actionCount.off_count === 0) {
        return (
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                <div className="flex justify-center items-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Activity size={28} className="text-purple-500" />
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Thống kê hôm nay</h3>
                        <p className="text-sm text-gray-500">{getCurrentDate()}</p>
                    </div>
                </div>
                <button 
                    onClick={fetchDailyCounts}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Làm mới"
                >
                    <Activity size={20} className="text-gray-600" />
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* Alert Statistics */}
            <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <Bell size={20} className="text-orange-500" />
                    <h4 className="font-semibold text-gray-800">Số lượt cảnh báo</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
                        <div className="text-2xl font-bold text-orange-600">
                            {alertCount.total_count}
                        </div>
                        <div className="text-sm text-orange-700 font-medium">Tổng số</div>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Nghiêm trọng:</span>
                            <span className="text-sm font-semibold text-red-600">{alertCount.high_count}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Cảnh báo:</span>
                            <span className="text-sm font-semibold text-yellow-600">{alertCount.medium_count}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Thông tin:</span>
                            <span className="text-sm font-semibold text-blue-600">{alertCount.low_count}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Statistics */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Power size={20} className="text-green-500" />
                    <h4 className="font-semibold text-gray-800">Số lượt bật tắt</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                        <div className="text-2xl font-bold text-green-600">
                            {actionCount.on_count + actionCount.off_count}
                        </div>
                        <div className="text-sm text-green-700 font-medium">Tổng số</div>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Bật:</span>
                            <span className="text-sm font-semibold text-green-600">{actionCount.on_count}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Tắt:</span>
                            <span className="text-sm font-semibold text-gray-600">{actionCount.off_count}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Thành công:</span>
                            <span className="text-sm font-semibold text-blue-600">{actionCount.on_count + actionCount.off_count}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
