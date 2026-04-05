export const DATA_SENSOR_FILTER_OPTIONS = [
    { type: 'all', displayText: 'Tất cả' },
    { type: 'temperature', displayText: 'Nhiệt kế' },
    { type: 'humidity', displayText: 'Máy bơm' },
    { type: 'light', displayText: 'Quang cảm' },
    { type: 'gas', displayText: 'Khoá gas' },
    { type: 'time', displayText: 'Thời gian' }
];

export const ACTION_HISTORY_FILTER_OPTIONS = [
    { type: 'all', displayText: 'Tất cả' },
    { type: 'humidity', displayText: 'Máy bơm' },
    { type: 'gas', displayText: 'Khoá gas' },
    { type: 'light', displayText: 'Quang cảm' },
    { type: 'temperature', displayText: 'Nhiệt kế' }
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
    khoa: 'Khóa gas'
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