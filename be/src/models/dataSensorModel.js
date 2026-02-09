const db = require('../config/db');
const {v4: uuidv4} = require('uuid');

class DataSensor{
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

        // Count total
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM data_sensors ds ${whereClause}`,
            queryParams
        );
        const total = countResult[0].total;

        // Get data - pivot table for 4 sensors
        const [rows] = await db.query(
            `SELECT 
                @row_number := @row_number + 1 AS stt,
                MAX(CASE WHEN s.name = 'temperature' THEN ds.value END) as temperature,
                MAX(CASE WHEN s.name = 'humidity' THEN ds.value END) as humidity,
                MAX(CASE WHEN s.name = 'light' THEN ds.value END) as light,
                MAX(CASE WHEN s.name = 'dust' THEN ds.value END) as dust,
                ds.created_at as timestamp
            FROM data_sensors ds
            JOIN sensors s ON ds.sensor_id = s.id
            CROSS JOIN (SELECT @row_number := ?) AS rn
            ${whereClause}
            GROUP BY ds.created_at
            ORDER BY ds.${orderBy} ${orderDirection}
            LIMIT ? OFFSET ?`,
            [offset, ...queryParams, parseInt(limit), offset]
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

    static async create(dataSensorData){
        const id = uuidv4();
        const {sensor_id, value} = dataSensorData;
        await db.query('INSERT INTO data_sensors (id, sensor_id, value) VALUES (?, ?, ?)',
            [id, sensor_id, value]
        );
        return this.getById(id);
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