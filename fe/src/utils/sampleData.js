const sampleActionHistoryData = [
    {
        id: 1,
        deviceName: 'Điều hòa Khách',
        action: 'off',
        status: 'success',
        executor: 'User',
        timestamp: '2026-01-30 22:13:00'
    },
    {
        id: 2,
        deviceName: 'Máy hút ẩm',
        action: 'off',
        status: 'success',
        executor: 'Auto',
        timestamp: '2026-01-30 21:46:00'
    },
    {
        id: 3,
        deviceName: 'Điều hòa Master',
        action: 'on',
        status: 'success',
        executor: 'User',
        timestamp: '2026-01-30 21:12:00'
    },
    {
        id: 4,
        deviceName: 'Loa thông minh',
        action: 'on',
        status: 'error',
        executor: 'Auto',
        timestamp: '2026-01-30 19:58:00'
    },
    {
        id: 5,
        deviceName: 'Máy lọc không khí',
        action: 'off',
        status: 'success',
        executor: 'Auto',
        timestamp: '2026-01-30 21:40:00'
    },
    {
        id: 6,
        deviceName: 'Quạt thông gió',
        action: 'on',
        status: 'success',
        executor: 'Auto',
        timestamp: '2026-01-30 17:42:00'
    },
    {
        id: 7,
        deviceName: 'Robot hút bụi',
        action: 'off',
        status: 'success',
        executor: 'User',
        timestamp: '2026-01-30 21:48:00'
    },
    {
        id: 8,
        deviceName: 'Bình nóng lạnh',
        action: 'off',
        status: 'success',
        executor: 'User',
        timestamp: '2026-01-30 19:18:00'
    },
    {
        id: 9,
        deviceName: 'Cửa cuốn Gara',
        action: 'off',
        status: 'success',
        executor: 'Auto',
        timestamp: '2026-01-30 18:09:00'
    },
    {
        id: 10,
        deviceName: 'LED Phòng Ngủ',
        action: 'on',
        status: 'success',
        executor: 'User',
        timestamp: '2026-01-30 19:20:00'
    },
    {
        id: 11,
        deviceName: 'Tivi Phòng Khách',
        action: 'on',
        status: 'success',
        executor: 'User',
        timestamp: '2026-01-30 14:04:00'
    },
    {
        id: 12,
        deviceName: 'Điều hòa Khách',
        action: 'off',
        status: 'success',
        executor: 'User',
        timestamp: '2026-01-30 16:42:00'
    },
    {
        id: 13,
        deviceName: 'Máy sưởi',
        action: 'on',
        status: 'success',
        executor: 'User',
        timestamp: '2026-01-30 12:32:00'
    },
    {
        id: 14,
        deviceName: 'Điều hòa Khách',
        action: 'off',
        status: 'error',
        executor: 'Auto',
        timestamp: '2026-01-30 17:08:00'
    },
    {
        id: 15,
        deviceName: 'Máy sưởi',
        action: 'off',
        status: 'success',
        executor: 'Auto',
        timestamp: '2026-01-30 07:30:00'
    },
    {
        id: 16,
        deviceName: 'Quạt thông gió',
        action: 'off',
        status: 'success',
        executor: 'Auto',
        timestamp: '2026-01-30 09:26:00'
    },
    {
        id: 17,
        deviceName: 'Loa thông minh',
        action: 'off',
        status: 'success',
        executor: 'Auto',
        timestamp: '2026-01-30 07:29:00'
    },
    {
        id: 18,
        deviceName: 'Điều hòa Master',
        action: 'off',
        status: 'success',
        executor: 'User',
        timestamp: '2026-01-30 05:24:00'
    },
    {
        id: 19,
        deviceName: 'LED Bếp',
        action: 'off',
        status: 'success',
        executor: 'User',
        timestamp: '2026-01-30 12:03:00'
    },
    {
        id: 20,
        deviceName: 'Điều hòa Khách',
        action: 'off',
        status: 'success',
        executor: 'User',
        timestamp: '2026-01-30 17:10:00'
    },
    {
        id: 21,
        deviceName: 'Máy lọc không khí',
        action: 'off',
        status: 'success',
        executor: 'User',
        timestamp: '2026-01-30 12:00:00'
    },
    {
        id: 22,
        deviceName: 'Loa thông minh',
        action: 'off',
        status: 'success',
        executor: 'User',
        timestamp: '2026-01-30 12:36:00'
    },
    {
        id: 23,
        deviceName: 'Quạt thông gió',
        action: 'on',
        status: 'success',
        executor: 'User',
        timestamp: '2026-01-30 12:55:00'
    },
    {
        id: 24,
        deviceName: 'LED Ban Công',
        action: 'on',
        status: 'success',
        executor: 'User',
        timestamp: '2026-01-30 13:18:00'
    },
    {
        id: 25,
        deviceName: 'Loa thông minh',
        action: 'off',
        status: 'success',
        executor: 'User',
        timestamp: '2026-01-30 19:35:00'
    }
];

const sampleDataSensorData = [
    {
        id: 1,
        deviceName: 'Cảm biến Phòng Khách',
        temperature: 26.5,
        humidity: 60,
        light: 450, // Lux
        dust: 35,   // PM2.5
        timestamp: '2026-01-30 22:15:00'
    },
    {
        id: 2,
        deviceName: 'Cảm biến Phòng Ngủ',
        temperature: 24.0,
        humidity: 55,
        light: 120,
        dust: 12,
        timestamp: '2026-01-30 22:10:00'
    },
    {
        id: 3,
        deviceName: 'Cảm biến Bếp',
        temperature: 28.5,
        humidity: 70,
        light: 600,
        dust: 45,
        timestamp: '2026-01-30 22:05:00'
    },
    {
        id: 4,
        deviceName: 'Cảm biến Ngoài trời',
        temperature: 22.0,
        humidity: 85,
        light: 0,
        dust: 80,
        timestamp: '2026-01-30 22:00:00'
    },
    {
        id: 5,
        deviceName: 'Máy lọc không khí',
        temperature: 25.5,
        humidity: 58,
        light: 300,
        dust: 10,
        timestamp: '2026-01-30 21:55:00'
    },
    {
        id: 6,
        deviceName: 'Cảm biến Phòng Khách',
        temperature: 26.8,
        humidity: 59,
        light: 460,
        dust: 38,
        timestamp: '2026-01-30 21:50:00'
    },
    {
        id: 7,
        deviceName: 'Cảm biến Ban Công',
        temperature: 23.5,
        humidity: 75,
        light: 20,
        dust: 65,
        timestamp: '2026-01-30 21:45:00'
    },
    {
        id: 8,
        deviceName: 'Cảm biến Phòng Ngủ',
        temperature: 24.2,
        humidity: 56,
        light: 200,
        dust: 15,
        timestamp: '2026-01-30 21:40:00'
    },
    {
        id: 9,
        deviceName: 'Cảm biến Bếp',
        temperature: 29.0,
        humidity: 68,
        light: 580,
        dust: 50,
        timestamp: '2026-01-30 21:35:00'
    },
    {
        id: 10,
        deviceName: 'Máy lọc không khí',
        temperature: 25.2,
        humidity: 57,
        light: 310,
        dust: 25,
        timestamp: '2026-01-30 21:30:00'
    },
    {
        id: 11,
        deviceName: 'Cảm biến Phòng Khách',
        temperature: 27.0,
        humidity: 62,
        light: 480,
        dust: 40,
        timestamp: '2026-01-30 21:25:00'
    },
    {
        id: 12,
        deviceName: 'Cảm biến Ngoài trời',
        temperature: 22.5,
        humidity: 82,
        light: 5,
        dust: 75,
        timestamp: '2026-01-30 21:20:00'
    },
    {
        id: 13,
        deviceName: 'Cảm biến Gara',
        temperature: 28.0,
        humidity: 50,
        light: 100,
        dust: 90,
        timestamp: '2026-01-30 21:15:00'
    },
    {
        id: 14,
        deviceName: 'Cảm biến Phòng Ngủ',
        temperature: 24.5,
        humidity: 54,
        light: 250,
        dust: 18,
        timestamp: '2026-01-30 21:10:00'
    },
    {
        id: 15,
        deviceName: 'Cảm biến Bếp',
        temperature: 28.2,
        humidity: 72,
        light: 620,
        dust: 42,
        timestamp: '2026-01-30 21:05:00'
    },
    {
        id: 16,
        deviceName: 'Máy lọc không khí',
        temperature: 25.0,
        humidity: 60,
        light: 290,
        dust: 30,
        timestamp: '2026-01-30 21:00:00'
    },
    {
        id: 17,
        deviceName: 'Cảm biến Phòng Khách',
        temperature: 27.2,
        humidity: 61,
        light: 500,
        dust: 36,
        timestamp: '2026-01-30 20:55:00'
    },
    {
        id: 18,
        deviceName: 'Cảm biến Ban Công',
        temperature: 24.0,
        humidity: 78,
        light: 40,
        dust: 60,
        timestamp: '2026-01-30 20:50:00'
    },
    {
        id: 19,
        deviceName: 'Cảm biến Phòng Ngủ',
        temperature: 24.8,
        humidity: 53,
        light: 300,
        dust: 20,
        timestamp: '2026-01-30 20:45:00'
    },
    {
        id: 20,
        deviceName: 'Cảm biến Ngoài trời',
        temperature: 23.0,
        humidity: 80,
        light: 10,
        dust: 70,
        timestamp: '2026-01-30 20:40:00'
    },
    {
        id: 21,
        deviceName: 'Cảm biến Bếp',
        temperature: 29.5,
        humidity: 65,
        light: 650,
        dust: 48,
        timestamp: '2026-01-30 20:35:00'
    },
    {
        id: 22,
        deviceName: 'Cảm biến Gara',
        temperature: 27.5,
        humidity: 52,
        light: 120,
        dust: 85,
        timestamp: '2026-01-30 20:30:00'
    },
    {
        id: 23,
        deviceName: 'Máy lọc không khí',
        temperature: 25.8,
        humidity: 55,
        light: 320,
        dust: 22,
        timestamp: '2026-01-30 20:25:00'
    },
    {
        id: 24,
        deviceName: 'Cảm biến Phòng Khách',
        temperature: 27.5,
        humidity: 63,
        light: 520,
        dust: 33,
        timestamp: '2026-01-30 20:20:00'
    },
    {
        id: 25,
        deviceName: 'Cảm biến Phòng Ngủ',
        temperature: 25.0,
        humidity: 52,
        light: 350,
        dust: 16,
        timestamp: '2026-01-30 20:15:00'
    }
];

const sampleNotificationData = [
    {
        "critical": "normal",
        "deviceName": "Cảm biến Phòng Khách",
        "timestamp": "2026-01-30 22:15:00",
        "description": {
            "title": "Hoạt động bình thường",
            "description": "Nhiệt độ 26.5°C, Độ ẩm 60%"
        }
    },
    {
        "critical": "normal",
        "deviceName": "Cảm biến Phòng Ngủ",
        "timestamp": "2026-01-30 22:10:00",
        "description": {
            "title": "Hoạt động bình thường",
            "description": "Nhiệt độ 24.0°C, Độ ẩm 55%"
        }
    },
    {
        "critical": "medium",
        "deviceName": "Cảm biến Bếp",
        "timestamp": "2026-01-30 22:05:00",
        "description": {
            "title": "Chất lượng không khí kém",
            "description": "Chỉ số bụi 45 PM2.5 hơi cao"
        }
    },
    {
        "critical": "high",
        "deviceName": "Cảm biến Ngoài trời",
        "timestamp": "2026-01-30 22:00:00",
        "description": {
            "title": "Cảnh báo bụi mịn",
            "description": "Chỉ số bụi 80 PM2.5 vượt ngưỡng an toàn"
        }
    },
    {
        "critical": "normal",
        "deviceName": "Máy lọc không khí",
        "timestamp": "2026-01-30 21:55:00",
        "description": {
            "title": "Hoạt động bình thường",
            "description": "Nhiệt độ 25.5°C, Độ ẩm 58%"
        }
    },
    {
        "critical": "normal",
        "deviceName": "Cảm biến Phòng Khách",
        "timestamp": "2026-01-30 21:50:00",
        "description": {
            "title": "Hoạt động bình thường",
            "description": "Nhiệt độ 26.8°C, Độ ẩm 59%"
        }
    },
    {
        "critical": "medium",
        "deviceName": "Cảm biến Ban Công",
        "timestamp": "2026-01-30 21:45:00",
        "description": {
            "title": "Chất lượng không khí kém",
            "description": "Chỉ số bụi 65 PM2.5 hơi cao"
        }
    },
    {
        "critical": "normal",
        "deviceName": "Cảm biến Phòng Ngủ",
        "timestamp": "2026-01-30 21:40:00",
        "description": {
            "title": "Hoạt động bình thường",
            "description": "Nhiệt độ 24.2°C, Độ ẩm 56%"
        }
    },
    {
        "critical": "medium",
        "deviceName": "Cảm biến Bếp",
        "timestamp": "2026-01-30 21:35:00",
        "description": {
            "title": "Chất lượng không khí kém",
            "description": "Chỉ số bụi 50 PM2.5 hơi cao"
        }
    },
    {
        "critical": "normal",
        "deviceName": "Máy lọc không khí",
        "timestamp": "2026-01-30 21:30:00",
        "description": {
            "title": "Hoạt động bình thường",
            "description": "Nhiệt độ 25.2°C, Độ ẩm 57%"
        }
    },
    {
        "critical": "normal",
        "deviceName": "Cảm biến Phòng Khách",
        "timestamp": "2026-01-30 21:25:00",
        "description": {
            "title": "Hoạt động bình thường",
            "description": "Nhiệt độ 27.0°C, Độ ẩm 62%"
        }
    },
    {
        "critical": "high",
        "deviceName": "Cảm biến Ngoài trời",
        "timestamp": "2026-01-30 21:20:00",
        "description": {
            "title": "Cảnh báo bụi mịn",
            "description": "Chỉ số bụi 75 PM2.5 vượt ngưỡng an toàn"
        }
    },
    {
        "critical": "high",
        "deviceName": "Cảm biến Gara",
        "timestamp": "2026-01-30 21:15:00",
        "description": {
            "title": "Cảnh báo bụi mịn",
            "description": "Chỉ số bụi 90 PM2.5 vượt ngưỡng an toàn"
        }
    },
    {
        "critical": "normal",
        "deviceName": "Cảm biến Phòng Ngủ",
        "timestamp": "2026-01-30 21:10:00",
        "description": {
            "title": "Hoạt động bình thường",
            "description": "Nhiệt độ 24.5°C, Độ ẩm 54%"
        }
    },
    {
        "critical": "medium",
        "deviceName": "Cảm biến Bếp",
        "timestamp": "2026-01-30 21:05:00",
        "description": {
            "title": "Chất lượng không khí kém",
            "description": "Chỉ số bụi 42 PM2.5 hơi cao"
        }
    },
    {
        "critical": "normal",
        "deviceName": "Máy lọc không khí",
        "timestamp": "2026-01-30 21:00:00",
        "description": {
            "title": "Hoạt động bình thường",
            "description": "Nhiệt độ 25.0°C, Độ ẩm 60%"
        }
    },
    {
        "critical": "normal",
        "deviceName": "Cảm biến Phòng Khách",
        "timestamp": "2026-01-30 20:55:00",
        "description": {
            "title": "Hoạt động bình thường",
            "description": "Nhiệt độ 27.2°C, Độ ẩm 61%"
        }
    },
    {
        "critical": "medium",
        "deviceName": "Cảm biến Ban Công",
        "timestamp": "2026-01-30 20:50:00",
        "description": {
            "title": "Chất lượng không khí kém",
            "description": "Chỉ số bụi 60 PM2.5 hơi cao"
        }
    },
    {
        "critical": "normal",
        "deviceName": "Cảm biến Phòng Ngủ",
        "timestamp": "2026-01-30 20:45:00",
        "description": {
            "title": "Hoạt động bình thường",
            "description": "Nhiệt độ 24.8°C, Độ ẩm 53%"
        }
    },
    {
        "critical": "medium",
        "deviceName": "Cảm biến Ngoài trời",
        "timestamp": "2026-01-30 20:40:00",
        "description": {
            "title": "Chất lượng không khí kém",
            "description": "Chỉ số bụi 70 PM2.5 hơi cao"
        }
    },
    {
        "critical": "medium",
        "deviceName": "Cảm biến Bếp",
        "timestamp": "2026-01-30 20:35:00",
        "description": {
            "title": "Chất lượng không khí kém",
            "description": "Chỉ số bụi 48 PM2.5 hơi cao"
        }
    },
    {
        "critical": "high",
        "deviceName": "Cảm biến Gara",
        "timestamp": "2026-01-30 20:30:00",
        "description": {
            "title": "Cảnh báo bụi mịn",
            "description": "Chỉ số bụi 85 PM2.5 vượt ngưỡng an toàn"
        }
    },
    {
        "critical": "normal",
        "deviceName": "Máy lọc không khí",
        "timestamp": "2026-01-30 20:25:00",
        "description": {
            "title": "Hoạt động bình thường",
            "description": "Nhiệt độ 25.8°C, Độ ẩm 55%"
        }
    },
    {
        "critical": "normal",
        "deviceName": "Cảm biến Phòng Khách",
        "timestamp": "2026-01-30 20:20:00",
        "description": {
            "title": "Hoạt động bình thường",
            "description": "Nhiệt độ 27.5°C, Độ ẩm 63%"
        }
    },
    {
        "critical": "normal",
        "deviceName": "Cảm biến Phòng Ngủ",
        "timestamp": "2026-01-30 20:15:00",
        "description": {
            "title": "Hoạt động bình thường",
            "description": "Nhiệt độ 25.0°C, Độ ẩm 52%"
        }
    }
]

export { sampleActionHistoryData, sampleDataSensorData, sampleNotificationData };