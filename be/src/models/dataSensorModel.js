const db = require('../config/db');
const {v4: uuidv4} = require('uuid');

class DataSensor{
    static async create(data) {
        const id = uuidv4();
        const { sensor_id, value, timestamp = new Date() } = data;
        const [result] = await db.query(
            'INSERT INTO data_sensors (id, sensor_id, value, created_at) VALUES (?, ?, ?, ?)',
            [id, sensor_id, value, timestamp]
        );
        return { id, sensor_id, value, created_at: timestamp };
    }

    static async getLatestBySensor(sensorId) {
        const [rows] = await db.query(
            `SELECT ds.id, ds.sensor_id, ds.value, ds.created_at as timestamp,
                    s.name, s.unit 
             FROM data_sensors ds
             JOIN sensors s ON ds.sensor_id = s.id
             WHERE ds.sensor_id = ?
             ORDER BY ds.created_at DESC
             LIMIT 1`,
            [sensorId]
        );
        return rows[0];
    }

    static async getHistory(filters = {}) {
        let query = `
            SELECT ds.id, ds.sensor_id, ds.value, ds.created_at as timestamp,
                   s.name, s.unit, s.device_id
            FROM data_sensors ds
            JOIN sensors s ON ds.sensor_id = s.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.sensorType) {
            // Match sensor name based on type (case-insensitive)
            const typeMap = {
                'temperature': 'nhiệt độ',
                'humidity': 'độ ẩm',
                'light': 'ánh sáng',
                'dust': 'bụi'
            };
            const sensorName = typeMap[filters.sensorType.toLowerCase()] || filters.sensorType;
            query += ' AND LOWER(s.name) LIKE LOWER(?)';
            params.push(`%${sensorName}%`);
        }

        if (filters.deviceId) {
            query += ' AND s.device_id = ?';
            params.push(filters.deviceId);
        }

        if (filters.startDate) {
            query += ' AND ds.created_at >= ?';
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            query += ' AND ds.created_at <= ?';
            params.push(filters.endDate);
        }

        query += ' ORDER BY ds.created_at DESC';

        if (filters.limit) {
            query += ' LIMIT ? OFFSET ?';
            params.push(parseInt(filters.limit), parseInt(filters.offset || 0));
        }

        const [rows] = await db.query(query, params);
        return rows;
    }

    static async getAggregateData(sensorId, interval = 'hour', limit = 24) {
        const intervalMap = {
            minute: '%Y-%m-%d %H:%i:00',
            hour: '%Y-%m-%d %H:00:00',
            day: '%Y-%m-%d'
        };

        const dateFormat = intervalMap[interval] || intervalMap.hour;

        const [rows] = await db.query(
            `SELECT 
                DATE_FORMAT(created_at, ?) as time_bucket,
                AVG(value) as avg_value,
                MIN(value) as min_value,
                MAX(value) as max_value,
                COUNT(*) as count
             FROM data_sensors
             WHERE sensor_id = ?
             GROUP BY time_bucket
             ORDER BY time_bucket DESC
             LIMIT ?`,
            [dateFormat, sensorId, limit]
        );
        return rows;
    }


    static async getAll(options = {}){
        const {
            page = 1,
            limit = 10,
            search = '',
            orderBy = 'created_at',
            orderDirection = 'DESC',
            filters = {}
        } = options;

        const offset = (page - 1) * limit;
        let whereConditions = [];
        let queryParams = [];

        // Search by exact time
        if (search) {
            // Parse search to determine precision
            const timeParts = search.split(':');
            if (timeParts.length === 3) {
                // Exact second: HH:MM:SS
                whereConditions.push('TIME(ds.created_at) = ?');
                queryParams.push(search);
            } else if (timeParts.length === 2) {
                // Exact minute: HH:MM
                whereConditions.push('DATE_FORMAT(ds.created_at, "%H:%i") = ?');
                queryParams.push(search);
            } else if (timeParts.length === 1 && search.length <= 2) {
                // Hour: HH
                whereConditions.push('HOUR(ds.created_at) = ?');
                queryParams.push(parseInt(search));
            } else {
                // General search for device name or sensor name
                whereConditions.push('(d.name LIKE ? OR s.name LIKE ?)');
                queryParams.push(`%${search}%`, `%${search}%`);
            }
        }

        // Filters
        if (filters.sensor_id) {
            whereConditions.push('ds.sensor_id = ?');
            queryParams.push(filters.sensor_id);
        }
        if (filters.device_id) {
            whereConditions.push('s.device_id = ?');
            queryParams.push(filters.device_id);
        }
        if (filters.startDate && filters.endDate) {
            whereConditions.push('ds.created_at BETWEEN ? AND ?');
            queryParams.push(filters.startDate, filters.endDate);
        }
        if (filters.sensor_name) {
            whereConditions.push('s.name = ?');
            queryParams.push(filters.sensor_name);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        // Count total
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total 
            FROM data_sensors ds
            LEFT JOIN sensors s ON ds.sensor_id = s.id
            LEFT JOIN devices d ON s.device_id = d.id
            ${whereClause}`,
            queryParams
        );
        const total = countResult[0].total;

        // Get data with pagination
        const [rows] = await db.query(
            `SELECT 
                ds.id,
                ds.value,
                ds.created_at as timestamp,
                s.name as sensor_name,
                s.unit as sensor_unit,
                d.name as device_name
            FROM data_sensors ds 
            LEFT JOIN sensors s ON ds.sensor_id = s.id 
            LEFT JOIN devices d ON s.device_id = d.id 
            ${whereClause}
            ORDER BY ds.${orderBy} ${orderDirection}
            LIMIT ? OFFSET ?`,
            [...queryParams, parseInt(limit), offset]
        );

        return {
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    // Data Sensor Page: Get history of 4 sensor types with all details
    static async getSensorHistory(sensorIds, options = {}){
        const {
            page = 1,
            limit = 10,
            search = '',
            orderBy = 'created_at',
            orderDirection = 'DESC',
            filters = {}
        } = options;

        // Map frontend field names to database column names
        const orderByMap = {
            'timestamp': 'created_at',
            'created_at': 'created_at'
        };
        const dbOrderBy = orderByMap[orderBy] || 'created_at';

        const offset = (page - 1) * limit;
        let whereConditions = ['ds.sensor_id IN (?)'];
        let queryParams = [sensorIds];

        // Search by exact time
        if (search) {
            const timeParts = search.split(':');
            if (timeParts.length === 3) {
                whereConditions.push('TIME(ds.created_at) = ?');
                queryParams.push(search);
            } else if (timeParts.length === 2) {
                whereConditions.push('DATE_FORMAT(ds.created_at, "%H:%i") = ?');
                queryParams.push(search);
            } else if (timeParts.length === 1 && search.length <= 2) {
                whereConditions.push('HOUR(ds.created_at) = ?');
                queryParams.push(parseInt(search));
            }
        }

        // Filters
        if (filters.startDate && filters.endDate) {
            whereConditions.push('ds.created_at BETWEEN ? AND ?');
            queryParams.push(filters.startDate, filters.endDate);
        }

        const whereClause = 'WHERE ' + whereConditions.join(' AND ');

        // Đầu tiên, lấy tất cả timestamps unique và đếm
        const [allTimestamps] = await db.query(
            `SELECT DISTINCT ds.created_at
             FROM data_sensors ds
             ${whereClause}
             ORDER BY ds.created_at ${orderDirection}`,
            queryParams
        );
        
        const total = allTimestamps.length;

        // Lấy subset timestamps theo pagination
        const paginatedTimestamps = allTimestamps.slice(offset, offset + parseInt(limit));
        
        if (paginatedTimestamps.length === 0) {
            return {
                data: [],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        }

        // Lấy data cho các timestamps đã phân trang
        const timestampList = paginatedTimestamps.map(t => t.created_at);
        
        const [rows] = await db.query(
            `SELECT 
                ds.created_at,
                s.name as sensor_name,
                ds.value
            FROM data_sensors ds
            JOIN sensors s ON ds.sensor_id = s.id
            WHERE ds.sensor_id IN (?) AND ds.created_at IN (?)
            ORDER BY ds.created_at ${orderDirection}`,
            [sensorIds, timestampList]
        );

        // Pivot data: group by timestamp và tạo object với các sensor values
        const dataMap = {};
        rows.forEach(row => {
            const timestamp = row.created_at;
            if (!dataMap[timestamp]) {
                dataMap[timestamp] = {
                    timestamp: timestamp,
                    temperature: null,
                    humidity: null,
                    light: null,
                    dust: null
                };
            }
            
            // Map sensor name to field
            const sensorName = row.sensor_name.toLowerCase();
            if (sensorName.includes('nhiệt độ') || sensorName.includes('temperature')) {
                dataMap[timestamp].temperature = row.value;
            } else if (sensorName.includes('độ ẩm') || sensorName.includes('humidity')) {
                dataMap[timestamp].humidity = row.value;
            } else if (sensorName.includes('ánh sáng') || sensorName.includes('light')) {
                dataMap[timestamp].light = row.value;
            } else if (sensorName.includes('bụi') || sensorName.includes('dust')) {
                dataMap[timestamp].dust = row.value;
            }
        });

        // Chuyển về array và thêm ID, format timestamp
        const result = Object.values(dataMap)
            .sort((a, b) => {
                if (orderDirection === 'DESC') {
                    return new Date(b.timestamp) - new Date(a.timestamp);
                }
                return new Date(a.timestamp) - new Date(b.timestamp);
            })
            .map((item, index) => ({
                id: offset + index + 1,
                temperature: item.temperature,
                humidity: item.humidity,
                light: item.light,
                dust: item.dust,
                timestamp: new Date(item.timestamp).toISOString().slice(0, 19).replace('T', ' ')
            }));

        return {
            data: result,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    static async getById(id){
        const [rows] = await db.query(
            `SELECT ds.*, s.name as sensor_name, s.unit as sensor_unit, d.name as device_name 
            FROM data_sensors ds 
            LEFT JOIN sensors s ON ds.sensor_id = s.id 
            LEFT JOIN devices d ON s.device_id = d.id 
            WHERE ds.id = ?`,
            [id]
        );
        return rows[0];
    }

    static async getBySensorId(sensor_id){
        const [rows] = await db.query(
            `SELECT * FROM data_sensors WHERE sensor_id = ? ORDER BY created_at DESC`,
            [sensor_id]
        );
        return rows;
    }

    static async delete(id){
        const [result] = await db.execute('DELETE FROM data_sensors WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async deleteOldData(cutoffDate=30){
        const [result] = await db.execute(
            'DELETE FROM data_sensors WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)', 
            [cutoffDate]
        );
        return result.affectedRows;
    }

    static async getLatestBySensorId(sensor_id){
        const [rows] = await db.query(
            `SELECT * FROM data_sensors 
            WHERE sensor_id = ? 
            ORDER BY created_at DESC 
            LIMIT 1`,
            [sensor_id]
        );
        return rows[0];
    }

    static async getAggregateData(sensor_id, interval='hourly', limit=24){
        let dateFormat;
        let groupBy;
        switch(interval){
            case 'hourly':
                dateFormat = '%Y-%m-%d %H:00:00';
                groupBy = 'YEAR(created_at), MONTH(created_at), DAY(created_at), HOUR(created_at)'; 
                break;
            case 'daily':
                dateFormat = '%Y-%m-%d 00:00:00';
                groupBy = 'YEAR(created_at), MONTH(created_at), DAY(created_at)'; 
                break;
            case 'monthly':
                dateFormat = '%Y-%m-01 00:00:00';
                groupBy = 'YEAR(created_at), MONTH(created_at)'; 
                break;
            default:
                throw new Error('Invalid interval');
        }
        const [rows] = await db.query(
            `SELECT 
                DATE_FORMAT(created_at, ?) as period,
                AVG(value) as avg_value,
                MIN(value) as min_value,
                MAX(value) as max_value
            FROM data_sensors
            WHERE sensor_id = ?
            GROUP BY ${groupBy}
            ORDER BY period DESC
            LIMIT ?`,
            [dateFormat, sensor_id, limit]
        );
        return rows.reverse();
    }

    static async getStatistics(sensor_id, startDate, endDate){
        const [rows] = await db.query(
            `SELECT
                AVG(value) as avg_value,
                MIN(value) as min_value,
                MAX(value) as max_value
            FROM data_sensors
            WHERE sensor_id = ? AND created_at BETWEEN ? AND ?`,
            [sensor_id, startDate, endDate]
        );
        return rows[0];
    }
}

module.exports = DataSensor;