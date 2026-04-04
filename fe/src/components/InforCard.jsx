import React, {useState, useEffect} from 'react'
import { Thermometer, Wind, Droplets, Sun, Cloud} from 'lucide-react';

const clamp01 = (value) => Math.min(1, Math.max(0, Number(value) || 0));

const toRgba = (hexColor, alpha = 1) => {
    const normalized = String(hexColor || '').replace('#', '');
    const safeHex = normalized.length === 3
        ? normalized.split('').map((char) => `${char}${char}`).join('')
        : normalized.padEnd(6, '0').slice(0, 6);
    const intValue = Number.parseInt(safeHex, 16);
    const r = (intValue >> 16) & 255;
    const g = (intValue >> 8) & 255;
    const b = intValue & 255;
    return `rgba(${r}, ${g}, ${b}, ${clamp01(alpha)})`;
};

const normalizeSensorLevel = (value, min, max) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric) || max <= min) return 0;
    return clamp01((numeric - min) / (max - min));
};

export default function InforCard({
    temperature,
    humidity,
    light,
    gas
}) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, [])

    const formatTime = (date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return {hours, minutes, seconds};
    }

    const formatDate = (date) => {
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const dayName = days[date.getDay()];
        const day = date.getDate()
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `${dayName}\n${day} thg ${month}, ${year}`;
    }

    const {hours, minutes, seconds} = formatTime(currentTime);

    const sensorLevels = {
        temperature: normalizeSensorLevel(temperature, 0, 50),
        humidity: normalizeSensorLevel(humidity, 0, 100),
        light: normalizeSensorLevel(light, 0, 100),
        gas: normalizeSensorLevel(gas, 0, 100)
    };

    const palette = {
        temperature: '#ef4444',
        humidity: '#3b82f6',
        light: '#f59e0b',
        gas: '#6b7280'
    };

    const titleColor = toRgba(palette.temperature, 0.5 + sensorLevels.temperature * 0.45);
    const primaryValueColor = toRgba(palette.temperature, 0.7 + sensorLevels.temperature * 0.3);
    const humidityColor = toRgba(palette.humidity, 0.58 + sensorLevels.humidity * 0.4);
    const lightColor = toRgba(palette.light, 0.58 + sensorLevels.light * 0.4);
    const gasColor = toRgba(palette.gas, 0.58 + sensorLevels.gas * 0.4);
    // const dateColor = toRgba('#1f2937', 0.48 + sensorLevels.temperature * 0.25);
    // const cloudColor = toRgba('#9ca3af', '#9ca3af');

    return (
        <div className="bg-white rounded-3xl p-6 shadow-lg">
            {/* Header - Nhiệt độ */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500"
                        style={{
                            background: toRgba(palette.temperature, 0.1 + sensorLevels.temperature * 0.2),
                            boxShadow: `0 0 ${8 + sensorLevels.temperature * 10}px ${toRgba(palette.temperature, 0.08 + sensorLevels.temperature * 0.22)}`
                        }}
                    >
                        <Thermometer size={36} className="transition-colors duration-500" style={{ color: titleColor }}  />
                    </div>
                    
                    <span className="font-medium transition-colors duration-500" style={{ color: titleColor }}>Nhiệt độ</span>
                </div>
                <div className="text-right relative">
                    <Cloud size={48} className="absolute top-0 right-0 transition-colors duration-500 text-gray-200" fill="currentColor" />
                    <div className="text-sm font-medium relative z-10 whitespace-pre-line transition-colors duration-500 text-gray-600">
                        {formatDate(currentTime)}
                    </div>
                </div>
            </div>

            {/* Nhiệt độ chính */}
            <div className="mb-6">
                <div className="text-5xl font-bold transition-colors duration-500" style={{ color: primaryValueColor }}>
                    {temperature}
                    <span className="text-3xl">°C</span>
                </div>
            </div>

            {/* Thông tin phụ */}
            <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500"
                        style={{ background: toRgba(palette.humidity, 0.1 + sensorLevels.humidity * 0.22) }}
                    >
                        <Droplets size={16} className="transition-colors duration-500" style={{ color: humidityColor }} />
                    </div>
                    <div>
                        <div className="text-xs text-gray-500" >Độ ẩm</div>
                        <div className="font-semibold transition-colors duration-500" style={{ color: humidityColor }}>{humidity}%</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500"
                        style={{ background: toRgba(palette.light, 0.1 + sensorLevels.light * 0.22) }}
                    >
                        <Sun size={16} className="transition-colors duration-500" style={{ color: lightColor }} />
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Ánh sáng</div>
                        <div className="font-semibold transition-colors duration-500" style={{ color: lightColor }}>{light}%</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500"
                        style={{ background: toRgba(palette.gas, 0.1 + sensorLevels.gas * 0.2) }}
                    >
                        <Wind size={16} className="transition-colors duration-500" style={{ color: gasColor }} />
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Khí gas</div>
                        <div className="font-semibold transition-colors duration-500" style={{ color: gasColor }}>{gas}%</div>
                    </div>
                </div>
            </div>

            {/* Đồng hồ */}
            <div className="flex items-center justify-center gap-2 text-5xl font-bold text-gray-900">
                <span>{hours}</span>
                <span className="animate-pulse">:</span>
                <span>{minutes}</span>
                <span className="animate-pulse">:</span>
                <span>{seconds}</span>
            </div>
        </div>
    );
}