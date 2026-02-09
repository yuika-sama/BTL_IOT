const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class Alert {
    static async getAll(options = {}) {
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
            const timeParts = search.split(':');
            if (timeParts.length === 3) {
                // Exact second: HH:MM:SS
                whereConditions.push('TIME(a.created_at) = ?');
                queryParams.push(search);
            } else if (timeParts.length === 2) {
                // Exact minute: HH:MM
                whereConditions.push('DATE_FORMAT(a.created_at, "%H:%i") = ?');
                queryParams.push(search);
            } else if (timeParts.length === 1 && search.length <= 2) {
                // Hour: HH
                whereConditions.push('HOUR(a.created_at) = ?');
                queryParams.push(parseInt(search));
            } else {
                // General search
                whereConditions.push('(a.title LIKE ? OR a.description LIKE ? OR d.name LIKE ?)');
                queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }
        }

        // Filters
        if (filters.severity) {
            whereConditions.push('a.severity = ?');
            queryParams.push(filters.severity);
        }
        if (filters.device_id) {
            whereConditions.push('a.device_id = ?');
            queryParams.push(filters.device_id);
        }
        if (filters.sensor_id) {
            whereConditions.push('a.sensor_id = ?');
            queryParams.push(filters.sensor_id);
        }
        if (filters.startDate && filters.endDate) {
            whereConditions.push('a.created_at BETWEEN ? AND ?');
            queryParams.push(filters.startDate, filters.endDate);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        // Count total
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total 
            FROM alerts a
            LEFT JOIN sensors s ON a.sensor_id = s.id
            LEFT JOIN devices d ON a.device_id = d.id
            ${whereClause}`,
            queryParams
        );
        const total = countResult[0].total;

        // Get data with pagination (for Notification page)
        const [rows] = await db.query(
            `SELECT 
                a.id,
                a.severity,
                d.name as device_name,
                a.created_at as timestamp,
                a.title,
                a.description
            FROM alerts a
            LEFT JOIN sensors s ON a.sensor_id = s.id
            LEFT JOIN devices d ON a.device_id = d.id
            ${whereClause}
            ORDER BY a.${orderBy} ${orderDirection}
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

    static async getById(id) {
        const [rows] = await db.query(
            `SELECT a.*, 
                s.name as sensor_name, 
                d.name as device_name,
                d.type as device_type
            FROM alerts a
            LEFT JOIN sensors s ON a.sensor_id = s.id
            LEFT JOIN devices d ON a.device_id = d.id
            WHERE a.id = ?`,
            [id]
        );
        return rows[0];
    }

    static async getByDeviceId(deviceId, limit = 50) {
        const [rows] = await db.query(
            `SELECT a.*, s.name as sensor_name 
            FROM alerts a
            LEFT JOIN sensors s ON a.sensor_id = s.id
            WHERE a.device_id = ? 
            ORDER BY a.created_at DESC 
            LIMIT ?`,
            [deviceId, limit]
        );
        return rows;
    }

    static async getBySensorId(sensorId, limit = 50) {
        const [rows] = await db.query(
            `SELECT a.*, d.name as device_name 
            FROM alerts a
            LEFT JOIN devices d ON a.device_id = d.id
            WHERE a.sensor_id = ? 
            ORDER BY a.created_at DESC 
            LIMIT ?`,
            [sensorId, limit]
        );
        return rows;
    }

    static async getBySeverity(severity, limit = 50) {
        const [rows] = await db.query(
            `SELECT a.*, 
                s.name as sensor_name, 
                d.name as device_name
            FROM alerts a
            LEFT JOIN sensors s ON a.sensor_id = s.id
            LEFT JOIN devices d ON a.device_id = d.id
            WHERE a.severity = ? 
            ORDER BY a.created_at DESC 
            LIMIT ?`,
            [severity, limit]
        );
        return rows;
    }

    static async create(alertData) {
        const id = uuidv4();
        const { sensor_id, device_id, title, description, severity } = alertData;
        
        await db.query(
            'INSERT INTO alerts (id, sensor_id, device_id, title, description, severity) VALUES (?, ?, ?, ?, ?, ?)',
            [id, sensor_id, device_id, title, description, severity]
        );
        
        return this.getById(id);
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM alerts WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async deleteOldAlerts(days = 30) {
        const [result] = await db.query(
            'DELETE FROM alerts WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
            [days]
        );
        return result.affectedRows;
    }

    static async getByDateRange(startDate, endDate) {
        const [rows] = await db.query(
            `SELECT a.*, 
                s.name as sensor_name, 
                d.name as device_name
            FROM alerts a
            LEFT JOIN sensors s ON a.sensor_id = s.id
            LEFT JOIN devices d ON a.device_id = d.id
            WHERE a.created_at BETWEEN ? AND ?
            ORDER BY a.created_at DESC`,
            [startDate, endDate]
        );
        return rows;
    }

    static async getStatistics() {
        const [rows] = await db.query(
            `SELECT 
                severity,
                COUNT(*) as count,
                DATE(created_at) as date
            FROM alerts
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY severity, DATE(created_at)
            ORDER BY date DESC, severity`
        );
        return rows;
    }
}

module.exports = Alert;