import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import actionHistoryService from '../services/actionHistoryService.js';

const DeviceActionStatsChart = ({ selectedDate = '', autoRefresh = false }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchByDate = () => fetchStats(selectedDate);
        fetchByDate();

        if (!autoRefresh) {
            return undefined;
        }

        // Cập nhật mỗi 30 giây nếu bật chế độ realtime
        const interval = setInterval(fetchByDate, 30000);
        return () => clearInterval(interval);
    }, [selectedDate, autoRefresh]);

    const fetchStats = async (date) => {
        try {
            const response = await actionHistoryService.getStats(date);
            if (response.success) {
                setData(response.data);
            }
        } catch (error) {
            console.error('Error fetching action stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && data.length === 0) {
        return (
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] shadow-xl border border-white/20 mb-8 h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium">Đang tải thống kê...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] shadow-xl border border-white/20 mb-8 transition-all duration-500 hover:shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Thống kê bật tắt thiết bị
                    </h3>
                    <p className="text-gray-500 font-medium mt-1">
                        Số lần thao tác thành công theo ngày đã chọn
                    </p>
                </div>
                <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 h-fit">
                    <span className="text-blue-600 font-semibold text-sm">
                        {autoRefresh ? 'Real-time Stats' : 'Daily Stats'}
                    </span>
                </div>
            </div>
            
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                        data={data} 
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                        barGap={12}
                    >
                        <defs>
                            <linearGradient id="colorOn" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="colorOff" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.1}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="device_name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 12 }} 
                        />
                        <Tooltip 
                            contentStyle={{ 
                                borderRadius: '1.25rem', 
                                border: 'none', 
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                                padding: '12px 16px'
                            }}
                            cursor={{ fill: '#f1f5f9', radius: 10 }}
                        />
                        <Legend 
                            iconType="circle" 
                            verticalAlign="top" 
                            align="right"
                            wrapperStyle={{ paddingBottom: '30px', fontWeight: 500 }} 
                        />
                        <Bar 
                            name="Số lần Bật" 
                            dataKey="on_count" 
                            fill="url(#colorOn)" 
                            stroke="#22c55e"
                            strokeWidth={1}
                            radius={[8, 8, 0, 0]} 
                            barSize={32} 
                        />
                        <Bar 
                            name="Số lần Tắt" 
                            dataKey="off_count" 
                            fill="url(#colorOff)" 
                            stroke="#94a3b8"
                            strokeWidth={1}
                            radius={[8, 8, 0, 0]} 
                            barSize={32} 
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default DeviceActionStatsChart;
