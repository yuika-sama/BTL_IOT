import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import CustomTooltip from './ChartComponents/CustomTooltip.jsx';
import CustomLegend from './ChartComponents/CustomLegend.jsx';

export default function Chart({
    data1 = [],
    data2 = [],
    color1 = '#fbbf24',
    color2 = '#9ca3af',
    label1 = 'Ánh sáng',
    label2 = 'Bụi mịn',
    unit1 = 'lux',
    unit2 = 'PM2.5',
    min1 = 0,
    max1 = 700,
    min2 = 0,
    max2 = 100,
    title = 'Ánh sáng & bụi mịn',
    subtitle = 'Light Intensity & Dust trends'
}) {
    // Merge 2 data arrays theo timestamp
    const mergedData = data1.map((item1, index) => {
        const item2 = data2[index] || {};
        return {
            timestamp: new Date(item1.timestamp).toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            value1: item1.value,
            value2: item2.value || 0
        };
    });

    return (
        <div className="bg-white rounded-3xl p-6 shadow-lg">
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500">{subtitle}</p>
            </div>

            {/* Legend */}
            <CustomLegend color1={color1} color2={color2} label1={label1} label2={label2} />

            {/* Chart */}
            <ResponsiveContainer width="100%" height={225}>
                <LineChart 
                    data={mergedData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                    <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="#f0f0f0" 
                        vertical={false}
                    />
                    
                    <XAxis 
                        dataKey="timestamp"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        dy={10}
                    />
                    
                    {/* Left Y-Axis for data1 */}
                    <YAxis 
                        yAxisId="left"
                        domain={[min1, max1]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: color1, fontSize: 12 }}
                        label={{ 
                            value: unit1, 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { fill: color1, fontSize: 12 }
                        }}
                    />
                    
                    {/* Right Y-Axis for data2 */}
                    <YAxis 
                        yAxisId="right"
                        orientation="right"
                        domain={[min2, max2]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: color2, fontSize: 12 }}
                        label={{ 
                            value: unit2, 
                            angle: 90, 
                            position: 'insideRight',
                            style: { fill: color2, fontSize: 12 }
                        }}
                    />
                    
                    <Tooltip content={<CustomTooltip color1={color1} color2={color2} label1={label1} label2={label2} unit1={unit1} unit2={unit2} />} />
                    
                    {/* Line for data1 */}
                    <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="value1" 
                        stroke={color1}
                        strokeWidth={3}
                        dot={{ fill: color1, r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                    
                    {/* Line for data2 */}
                    <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="value2" 
                        stroke={color2}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}