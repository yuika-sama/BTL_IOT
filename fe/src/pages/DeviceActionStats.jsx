import React, { useMemo, useState } from 'react';
import MainLayout from '../components/MainLayout.jsx';
import DeviceActionStatsChart from '../components/DeviceActionStatsChart.jsx';
import { normalizeSensorLevel, createBackgroundTheme } from '../utils/themeUtils.js';

const getTodayDateInput = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DeviceActionStats() {
  const [selectedDate, setSelectedDate] = useState(getTodayDateInput());

  // Dùng mock sensor level để giữ hiệu ứng nền nhất quán với các trang còn lại.
  const backgroundTheme = useMemo(() => {
    const sensorLevels = {
      temperature: normalizeSensorLevel(30, 0, 50),
      humidity: normalizeSensorLevel(60, 0, 100),
      light: normalizeSensorLevel(70, 0, 100),
      gas: normalizeSensorLevel(35, 0, 100),
    };

    return createBackgroundTheme(sensorLevels);
  }, []);

  return (
    <MainLayout backgroundTheme={backgroundTheme}>
      <section className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Quản lý số lần bật/tắt thiết bị</h1>
            <p className="text-gray-500 mt-1">Theo dõi số lần thao tác thành công của từng thiết bị theo ngày</p>
          </div>

          <label className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Chọn ngày</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        <DeviceActionStatsChart selectedDate={selectedDate} autoRefresh={false} />
      </section>
    </MainLayout>
  );
}
