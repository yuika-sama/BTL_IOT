const { query } = require('../config/db');

const SENSOR_TYPE_CONDITIONS = {
    temperature: "(LOWER(s.name) LIKE '%temp%' OR LOWER(s.name) LIKE '%nhiet%')",
    humidity: "(LOWER(s.name) LIKE '%hum%' OR LOWER(s.name) LIKE '%am%')",
    light: "(LOWER(s.name) LIKE '%light%' OR LOWER(s.name) LIKE '%anh%' OR LOWER(s.name) LIKE '%ldr%')",
    dust: "(LOWER(s.name) LIKE '%dust%' OR LOWER(s.name) LIKE '%bui%' OR LOWER(s.name) LIKE '%pm%' OR LOWER(s.name) LIKE '%gas%' OR LOWER(s.name) LIKE '%khi%')"
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

module.exports = {
    getDeviceList,
    getInitialSensorData,
    getLatestSensorValues
};
