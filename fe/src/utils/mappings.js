export const DATA_SENSOR_FILTER_OPTIONS = [
    { type: 'all', displayText: 'Theo thiết bị' },
    { type: 'temperature', displayText: 'Nhiệt kế' },
    { type: 'humidity', displayText: 'Máy bơm' },
    { type: 'light', displayText: 'Quang cảm' },
    { type: 'gas', displayText: 'Khoá gas' },
    { type: 'time', displayText: 'Thời gian' }
];

export const ACTION_HISTORY_FILTER_OPTIONS = [
    { type: 'all', displayText: 'Theo thiết bị' },
    { type: 'humidity', displayText: 'Máy bơm' },
    { type: 'gas', displayText: 'Khoá gas' },
    { type: 'light', displayText: 'Quang cảm' },
    { type: 'temperature', displayText: 'Nhiệt kế' },
    { type: 'green_led', displayText: 'Đèn xanh' },
    { type: 'red_led', displayText: 'Đèn đỏ' }
];

export const ACTION_HISTORY_ACTION_OPTIONS = [
    { value: 'all', label: 'Theo hành động' },
    { value: 'on', label: 'Bật' },
    { value: 'off', label: 'Tắt' }
];

export const ACTION_HISTORY_STATUS_OPTIONS = [
    { value: 'all', label: 'Theo trạng thái' },
    { value: 'success', label: 'Thành công' },
    { value: 'failed', label: 'Thất bại' },
    { value: 'waiting', label: 'Đang chờ' }
];

export const ACTION_HISTORY_EXECUTOR_OPTIONS = [
    { value: 'all', label: 'Theo đối tượng' },
    { value: 'auto', label: 'Hệ thống' },
    { value: 'manual', label: 'Người dùng' }
];

const DEVICE_DISPLAY_NAME_MAP = {
    dev_temp_led: 'Nhiệt độ',
    temp_led: 'Nhiệt độ',
    nhiet_ke: 'Nhiệt kế',
    nhiet: 'Nhiệt kế',
    dev_hum_led: 'Độ ẩm',
    hum_led: 'Độ ẩm',
    may_bom: 'Máy bơm',
    maybom: 'Máy bơm',
    dev_ldr_led: 'Ánh sáng',
    ldr_led: 'Ánh sáng',
    quang_cam: 'Quang cảm',
    quangcam: 'Quang cảm',
    dev_gas_led: 'Khí gas',
    gas_led: 'Khí gas',
    khoa_gas: 'Khóa gas',
    khoa: 'Khóa gas',
    dev_green_led: 'Đèn xanh',
    green_led: 'Đèn xanh',
    led_a: 'Đèn xanh',
    led_xanh: 'Đèn xanh',
    den_xanh: 'Đèn xanh',
    dev_red_led: 'Đèn đỏ',
    red_led: 'Đèn đỏ',
    led_b: 'Đèn đỏ',
    led_do: 'Đèn đỏ',
    den_do: 'Đèn đỏ'
};

const normalizeText = (value = '') => {
    return String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
};

export const getDeviceDisplayName = (deviceName = '') => {
    const normalizedName = normalizeText(deviceName);
    return DEVICE_DISPLAY_NAME_MAP[normalizedName] || deviceName;
};

export const getDeviceSensorKey = (deviceName = '') => {
    const normalizedName = normalizeText(deviceName);

    if (normalizedName.includes('green_led') || normalizedName.includes('led_a') || normalizedName.includes('led_xanh') || normalizedName.includes('den_xanh')) {
        return 'light';
    }

    if (normalizedName.includes('red_led') || normalizedName.includes('led_b') || normalizedName.includes('led_do') || normalizedName.includes('den_do')) {
        return 'gas';
    }

    if (normalizedName.includes('temp') || normalizedName.includes('nhiet')) {
        return 'temperature';
    }

    if (normalizedName.includes('hum') || normalizedName.includes('may_bom') || normalizedName.includes('do_am')) {
        return 'humidity';
    }

    if (normalizedName.includes('ldr') || normalizedName.includes('light') || normalizedName.includes('quang')) {
        return 'light';
    }

    if (normalizedName.includes('gas') || normalizedName.includes('dust') || normalizedName.includes('bui')) {
        return 'gas';
    }

    return 'gas';
};

export const getDeviceState = (value, status) => {
    const numericValue = Number(value);
    return status === 'waiting' ? 'waiting' : numericValue === 1 ? 'on' : 'off';
};

export const getDeviceStatusPayloadKey = (deviceName = '') => {
    const normalizedName = normalizeText(deviceName);

    if (normalizedName.includes('temp') || normalizedName.includes('nhiet')) {
        return 'temp_led';
    }

    if (normalizedName.includes('hum') || normalizedName.includes('may_bom') || normalizedName.includes('do_am')) {
        return 'hum_led';
    }

    if (normalizedName.includes('ldr') || normalizedName.includes('light') || normalizedName.includes('quang')) {
        return 'ldr_led';
    }

    if (normalizedName.includes('green_led') || normalizedName.includes('led_a') || normalizedName.includes('led_xanh') || normalizedName.includes('den_xanh')) {
        return 'led_a';
    }

    if (normalizedName.includes('red_led') || normalizedName.includes('led_b') || normalizedName.includes('led_do') || normalizedName.includes('den_do')) {
        return 'led_b';
    }

    if (normalizedName.includes('gas') || normalizedName.includes('dust') || normalizedName.includes('bui') || normalizedName.includes('khoa')) {
        return 'gas_led';
    }

    return null;
};

export const normalizeHardwareStatusValue = (rawValue) => {
    if (typeof rawValue === 'number') {
        return rawValue === 1 ? 1 : 0;
    }

    const normalized = String(rawValue || '').trim().toUpperCase();
    return normalized === 'ON' || normalized === '1' || normalized === 'TRUE' ? 1 : 0;
};