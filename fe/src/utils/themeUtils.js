// Theme constants and helper functions for dynamic background overlay

export const SENSOR_THEME = {
    temperature: { hex: '#f97316', glow: 'rgba(249, 115, 22, 0.42)' },
    humidity: { hex: '#38bdf8', glow: 'rgba(56, 189, 248, 0.42)' },
    light: { hex: '#facc15', glow: 'rgba(250, 204, 21, 0.45)' },
    gas: { hex: '#64748b', glow: 'rgba(100, 116, 139, 0.4)' }
};

export const hexToRgb = (hexColor) => {
    const normalized = String(hexColor || '').replace('#', '');
    const safeHex = normalized.length === 3
        ? normalized.split('').map((char) => `${char}${char}`).join('')
        : normalized.padEnd(6, '0').slice(0, 6);

    const intValue = Number.parseInt(safeHex, 16);
    return {
        r: (intValue >> 16) & 255,
        g: (intValue >> 8) & 255,
        b: intValue & 255
    };
};

export const toRgba = (hexColor, alpha = 1) => {
    const { r, g, b } = hexToRgb(hexColor);
    const safeAlpha = Math.min(1, Math.max(0, alpha));
    return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
};

export const mixThemeColor = (sensorLevels = {}) => {
    const keys = ['temperature', 'humidity', 'light', 'gas'];
    const base = { r: 246, g: 248, b: 254 };

    const totals = keys.reduce((acc, key) => {
        const level = Number(sensorLevels[key] || 0);
        const { r, g, b } = hexToRgb(SENSOR_THEME[key].hex);

        acc.weight += level;
        acc.r += r * level;
        acc.g += g * level;
        acc.b += b * level;
        return acc;
    }, { r: 0, g: 0, b: 0, weight: 0 });

    if (totals.weight <= 0.001) {
        return `rgb(${base.r}, ${base.g}, ${base.b})`;
    }

    const intensity = Math.min(0.72, totals.weight / keys.length);
    const mixed = {
        r: Math.round(base.r * (1 - intensity) + (totals.r / totals.weight) * intensity),
        g: Math.round(base.g * (1 - intensity) + (totals.g / totals.weight) * intensity),
        b: Math.round(base.b * (1 - intensity) + (totals.b / totals.weight) * intensity)
    };

    return `rgb(${mixed.r}, ${mixed.g}, ${mixed.b})`;
};

export const clamp01 = (value) => Math.min(1, Math.max(0, value));

export const normalizeSensorLevel = (value, min, max) => {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue) || max <= min) {
        return 0;
    }

    return clamp01((numericValue - min) / (max - min));
};

export const createBackgroundTheme = (sensorLevels = {}) => {
    const dominantSensorKey = Object.entries(sensorLevels)
        .sort((a, b) => Number(b[1]) - Number(a[1]))?.[0]?.[0] || 'temperature';
    const pageThemeColor = mixThemeColor(sensorLevels);
    const pageEnergy = Math.min(1, (sensorLevels.temperature + sensorLevels.humidity + sensorLevels.light + sensorLevels.gas) / 3);

    return {
        energy: pageEnergy,
        dominantKey: dominantSensorKey,
        gradientStops: [
            toRgba(pageThemeColor, 1),
            toRgba(SENSOR_THEME.humidity.hex, 0.22 + sensorLevels.humidity * 0.25),
            toRgba(SENSOR_THEME.light.hex, 0.2 + sensorLevels.light * 0.28),
            toRgba(SENSOR_THEME.temperature.hex, 0.18 + sensorLevels.temperature * 0.26)
        ],
        orbColors: {
            temperature: toRgba(SENSOR_THEME.temperature.hex, 0.12 + sensorLevels.temperature * 0.28),
            humidity: toRgba(SENSOR_THEME.humidity.hex, 0.12 + sensorLevels.humidity * 0.28),
            light: toRgba(SENSOR_THEME.light.hex, 0.12 + sensorLevels.light * 0.3),
            gas: toRgba(SENSOR_THEME.gas.hex, 0.1 + sensorLevels.gas * 0.28)
        }
    };
};
