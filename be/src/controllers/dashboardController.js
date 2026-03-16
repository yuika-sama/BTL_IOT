const { randomUUID } = require('crypto');
const { query } = require('../config/db');

const SENSOR_TYPE_CONDITIONS = {
    temperature: "(LOWER(s.name) LIKE '%temp%' OR LOWER(s.name) LIKE '%nhiet%')",
    humidity: "(LOWER(s.name) LIKE '%hum%' OR LOWER(s.name) LIKE '%am%')",
    light: "(LOWER(s.name) LIKE '%light%' OR LOWER(s.name) LIKE '%anh%' OR LOWER(s.name) LIKE '%ldr%')",
    dust: "(LOWER(s.name) LIKE '%dust%' OR LOWER(s.name) LIKE '%bui%' OR LOWER(s.name) LIKE '%pm%' OR LOWER(s.name) LIKE '%gas%' OR LOWER(s.name) LIKE '%khi%')"
};

const DEVICE_COMMAND_MAP = {
    TEMP: 'TEMP',
    HUM: 'HUM',
    LDR: 'LDR',
    LIGHT: 'LDR',
    DUST: 'DUST',
    GAS: 'GAS'
};

const resolveDeviceCommandPrefix = (deviceName = '') => {
    const upperName = String(deviceName).toUpperCase();

    const matched = Object.keys(DEVICE_COMMAND_MAP).find((key) => upperName.includes(key));
    if (!matched) {
        return 'DEVICE';
    }

    return DEVICE_COMMAND_MAP[matched];
};

const getAutoDecisionByThreshold = async (deviceId) => {
    const rows = await query(
        `
            SELECT
                s.id,
                s.threshold_min,
                s.threshold_max,
                (
                    SELECT ds.value
                    FROM data_sensors ds
                    WHERE ds.sensor_id = s.id
                    ORDER BY ds.created_at DESC
                    LIMIT 1
                ) AS latest_value
            FROM sensors s
            WHERE s.device_id = ?
        `,
        [deviceId]
    );

    const sensors = rows.filter((item) => item.latest_value !== null && item.latest_value !== undefined);
    if (!sensors.length) {
        return {
            hasDecision: false,
            shouldTurnOn: false
        };
    }

    const shouldTurnOn = sensors.some((item) => {
        const value = Number(item.latest_value);
        const min = item.threshold_min !== null && item.threshold_min !== undefined ? Number(item.threshold_min) : null;
        const max = item.threshold_max !== null && item.threshold_max !== undefined ? Number(item.threshold_max) : null;

        if (Number.isNaN(value)) {
            return false;
        }

        if (min !== null && !Number.isNaN(min) && value < min) {
            return true;
        }

        if (max !== null && !Number.isNaN(max) && value > max) {
            return true;
        }

        return false;
    });

    return {
        hasDecision: true,
        shouldTurnOn
    };
};

const getDeviceList = async (req, res) => {
    try {
        const sql = `
            SELECT
                id,
                name,
                status,
                auto_toggle,
                value,
                created_at,
                1 AS is_connected
            FROM devices
            ORDER BY created_at ASC
        `;

        const rows = await query(sql);

        return res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error while fetching dashboard devices:', error);
        return res.status(500).json({
            success: false,
            message: 'Khong the tai danh sach thiet bi',
            error: error.message
        });
    }
};

const getInitialSensorData = async (req, res) => {
    try {
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

        const loadSeries = async (type) => {
            const sql = `
                SELECT
                    ds.created_at AS timestamp,
                    ds.value
                FROM data_sensors ds
                INNER JOIN sensors s ON s.id = ds.sensor_id
                WHERE ${SENSOR_TYPE_CONDITIONS[type]}
                ORDER BY ds.created_at DESC
                LIMIT ${limit}
            `;

            const rows = await query(sql);
            return rows
                .map((row) => ({
                    timestamp: row.timestamp,
                    value: Number(row.value)
                }))
                .reverse();
        };

        const [temperature, humidity, light, dust] = await Promise.all([
            loadSeries('temperature'),
            loadSeries('humidity'),
            loadSeries('light'),
            loadSeries('dust')
        ]);

        return res.status(200).json({
            success: true,
            data: {
                temperature,
                humidity,
                light,
                dust
            }
        });
    } catch (error) {
        console.error('Error while fetching initial sensor data:', error);
        return res.status(500).json({
            success: false,
            message: 'Khong the tai du lieu khoi tao cho dashboard',
            error: error.message
        });
    }
};

const getLatestSensorValues = async (req, res) => {
    try {
        const loadLatest = async (type) => {
            const sql = `
                SELECT
                    ds.created_at AS timestamp,
                    ds.value
                FROM data_sensors ds
                INNER JOIN sensors s ON s.id = ds.sensor_id
                WHERE ${SENSOR_TYPE_CONDITIONS[type]}
                ORDER BY ds.created_at DESC
                LIMIT 1
            `;

            const rows = await query(sql);
            const item = rows?.[0] || null;

            if (!item) {
                return {
                    value: null,
                    timestamp: null
                };
            }

            return {
                value: Number(item.value),
                timestamp: item.timestamp
            };
        };

        const [temperature, humidity, light, dust] = await Promise.all([
            loadLatest('temperature'),
            loadLatest('humidity'),
            loadLatest('light'),
            loadLatest('dust')
        ]);

        const timestamps = [temperature.timestamp, humidity.timestamp, light.timestamp, dust.timestamp]
            .filter(Boolean)
            .sort();

        return res.status(200).json({
            success: true,
            data: {
                temperature: temperature.value,
                humidity: humidity.value,
                light: light.value,
                dust: dust.value,
                timestamp: timestamps.length ? timestamps[timestamps.length - 1] : null
            }
        });
    } catch (error) {
        console.error('Error while fetching latest sensor values:', error);
        return res.status(500).json({
            success: false,
            message: 'Khong the tai du lieu moi nhat cua cam bien',
            error: error.message
        });
    }
};

const toggleDevice = async (req, res) => {
    try {
        const { id } = req.params;

        const rows = await query(
            `
                SELECT id, name, value, status, auto_toggle
                FROM devices
                WHERE id = ?
                LIMIT 1
            `,
            [id]
        );

        const device = rows?.[0];
        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay thiet bi'
            });
        }

        const currentValue = Number(device.value || 0);
        const nextValue = currentValue === 1 ? 0 : 1;
        const commandPrefix = resolveDeviceCommandPrefix(device.name);
        const command = `${commandPrefix}_${nextValue === 1 ? 'ON' : 'OFF'}`;

        await query(
            `
                UPDATE devices
                SET value = ?, status = ?
                WHERE id = ?
            `,
            [nextValue, 'success', id]
        );

        await query(
            `
                INSERT INTO action_history (id, device_id, command, executor, status, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `,
            [randomUUID(), id, command, 'manual_api', 'success']
        );

        return res.status(200).json({
            success: true,
            data: {
                id,
                name: device.name,
                value: nextValue,
                status: 'success',
                auto_toggle: device.auto_toggle,
                command
            }
        });
    } catch (error) {
        console.error('Error while toggling device:', error);
        return res.status(500).json({
            success: false,
            message: 'Khong the bat/tat thiet bi',
            error: error.message
        });
    }
};

const toggleAutoMode = async (req, res) => {
    try {
        const { id } = req.params;

        const rows = await query(
            `
                SELECT id, name, value, status, auto_toggle
                FROM devices
                WHERE id = ?
                LIMIT 1
            `,
            [id]
        );

        const device = rows?.[0];
        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay thiet bi'
            });
        }

        const nextAutoToggle = Number(device.auto_toggle || 0) === 1 ? 0 : 1;
        let nextValue = Number(device.value || 0);

        if (nextAutoToggle === 1) {
            const autoDecision = await getAutoDecisionByThreshold(id);
            if (autoDecision.hasDecision) {
                nextValue = autoDecision.shouldTurnOn ? 1 : 0;
            }
        }

        await query(
            `
                UPDATE devices
                SET auto_toggle = ?, value = ?, status = ?
                WHERE id = ?
            `,
            [nextAutoToggle, nextValue, 'success', id]
        );

        const command = nextAutoToggle === 1 ? 'ENABLE_AUTO' : 'DISABLE_AUTO';
        await query(
            `
                INSERT INTO action_history (id, device_id, command, executor, status, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `,
            [randomUUID(), id, command, 'manual_api', 'success']
        );

        return res.status(200).json({
            success: true,
            data: {
                id,
                name: device.name,
                value: nextValue,
                status: 'success',
                auto_toggle: nextAutoToggle,
                command
            }
        });
    } catch (error) {
        console.error('Error while toggling auto mode:', error);
        return res.status(500).json({
            success: false,
            message: 'Khong the bat/tat che do tu dong',
            error: error.message
        });
    }
};

module.exports = {
    getDeviceList,
    getInitialSensorData,
    getLatestSensorValues,
    toggleDevice,
    toggleAutoMode
};
