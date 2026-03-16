import React, {useState, useEffect} from 'react'
import { Thermometer, Wind, Droplets, Sun, Cloud} from 'lucide-react';

export default function InforCard({temperature, humidity, light, gas}) {
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
    return (
        <div className="bg-white rounded-3xl p-6 shadow-lg">
            {/* Header - Nhiệt độ */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <Thermometer size={36} className="text-red-500"  />
                    </div>
                    
                    <span className="text-gray-600 font-medium">Nhiệt độ</span>
                </div>
                <div className="text-right relative">
                    <Cloud size={48} className="text-gray-200 absolute top-0 right-0" fill="currentColor" />
                    <div className="text-sm text-gray-600 font-medium relative z-10 whitespace-pre-line">
                        {formatDate(currentTime)}
                    </div>
                </div>
            </div>

            {/* Nhiệt độ chính */}
            <div className="mb-6">
                <div className="text-5xl font-bold text-gray-900">
                    {temperature}
                    <span className="text-3xl">°C</span>
                </div>
            </div>

            {/* Thông tin phụ */}
            <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Droplets size={16} className="text-blue-500" />
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Độ ẩm</div>
                        <div className="font-semibold text-gray-900">{humidity}%</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Sun size={16} className="text-yellow-500" />
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Ánh sáng</div>
                        <div className="font-semibold text-gray-900">{light}%</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Wind size={16} className="text-gray-500" />
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Khí gas</div>
                        <div className="font-semibold text-gray-900">{gas}%</div>
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