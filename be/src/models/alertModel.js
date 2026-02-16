const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class Alert {
    // Helper function to normalize search terms for severity
    static normalizeSeverityTerm(search) {
        const searchLower = search.toLowerCase().trim();
        
        // Map Vietnamese terms to database severity values
        const severityMap = {
            // High severity (Nghiêm trọng)
            'nghiêm trọng': 'high',
            'nghiem trong': 'high',
            'nghiêmtrọng': 'high',
            'nghiêm': 'high',
            'nghiem': 'high',
            'cao': 'high',
            'high': 'high',
            
            // Medium severity (Cảnh báo)
            'cảnh báo': 'medium',
            'canh bao': 'medium',
            'cảnhbáo': 'medium',
            'cb': 'medium',
            'trung bình': 'medium',
            'trung binh': 'medium',
            'trungbình': 'medium',
            'tb': 'medium',
            'medium': 'medium',
            'med': 'medium',
            'warning': 'medium',
            
            // Low severity (Thông tin)
            'thông tin': 'low',
            'thong tin': 'low',
            'thôngtín': 'low',
            'tt': 'low',
            'info': 'low',
            'information': 'low',
            'thấp': 'low',
            'thap': 'low',
            'low': 'low',
            
            // Normal severity (Bình thường)
            'bình thường': 'normal',
            'binh thuong': 'normal',
            'bìnhthường': 'normal',
            'bt': 'normal',
            'normal': 'normal',
            'ok': 'normal',
            
            // Critical (still supported for backward compatibility)
            'nguy hiểm': 'critical',
            'nguy hiem': 'critical',
            'critical': 'critical',
            'crit': 'critical'
        };
        
        return severityMap[searchLower] || search;
    }

    static async getAll(options = {}) {
        const {
            page = 1,
            limit = 10,
            search = '',
            filterType = '',
            orderBy = 'created_at',
            orderDirection = 'DESC',
        } = options;

        // Map frontend field names to database column names
        const orderByMap = {
            'timestamp': 'created_at',
            'created_at': 'created_at',
            'severity': 'severity'
        };
        const dbOrderBy = orderByMap[orderBy] || 'created_at';

        const offset = (page - 1) * limit;
        let whereConditions = [];
        let queryParams = [];

        // Search based on filterType
        if (search) {
            // Normalize search term for severity
            const normalizedSearch = this.normalizeSeverityTerm(search);
            
            if (filterType === 'name') {
                whereConditions.push('d.name LIKE ?');
                queryParams.push(`%${search}%`);
            } else if (filterType === 'severity') {
                // Search both original and normalized terms for severity
                whereConditions.push('(a.severity LIKE ? OR a.severity LIKE ?)');
                queryParams.push(`%${search}%`, `%${normalizedSearch}%`);
            } else if (filterType === 'time') {
                // Format datetime to DD/MM/YYYY HH:MM:SS for search
                whereConditions.push('DATE_FORMAT(a.created_at, "%d/%m/%Y %H:%i:%s") LIKE ?');
                queryParams.push(`%${search}%`);
            } else {
                // Search all fields including formatted time and both original/normalized terms
                whereConditions.push('(a.title LIKE ? OR a.description LIKE ? OR d.name LIKE ? OR a.severity LIKE ? OR a.severity LIKE ? OR DATE_FORMAT(a.created_at, "%d/%m/%Y %H:%i:%s") LIKE ?)');
                queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${normalizedSearch}%`, `%${search}%`);
            }
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
            ORDER BY a.${dbOrderBy} ${orderDirection}
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
                DATE_ADD(a.created_at, INTERVAL 7 HOUR) as timestamp
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
            `SELECT a.*, 
                s.name as sensor_name,
                DATE_ADD(a.created_at, INTERVAL 7 HOUR) as timestamp
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
            `SELECT a.*, 
                d.name as device_name,
                DATE_ADD(a.created_at, INTERVAL 7 HOUR) as timestamp
            FROM alerts a
            LEFT JOIN devices d ON a.device_id = d.id
            WHERE a.sensor_id = ? 
            ORDER BY a.created_at DESC 
            LIMIT ?`,
            [sensorId, limit]
        );
        return rows;
    }

    static async getStatistics() {
        const [rows] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN severity = 'HIGH' THEN 1 ELSE 0 END) as high,
                SUM(CASE WHEN severity = 'MEDIUM' THEN 1 ELSE 0 END) as medium,
                SUM(CASE WHEN severity = 'LOW' THEN 1 ELSE 0 END) as low,
                COUNT(DISTINCT device_id) as affected_devices,
                COUNT(DISTINCT sensor_id) as affected_sensors
            FROM alerts
        `);
        return rows[0];
    }

    static async getBySeverity(severity, limit = 50) {
        const [rows] = await db.query(
            `SELECT a.*, 
                s.name as sensor_name, 
                d.name as device_name,
                DATE_ADD(a.created_at, INTERVAL 7 HOUR) as timestamp
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
                d.name as device_name,
                DATE_ADD(a.created_at, INTERVAL 7 HOUR) as timestamp
            FROM alerts a
            LEFT JOIN sensors s ON a.sensor_id = s.id
            LEFT JOIN devices d ON a.device_id = d.id
            WHERE a.created_at BETWEEN ? AND ?
            ORDER BY a.created_at DESC`,
            [startDate, endDate]
        );
        return rows;
    }
}

module.exports = Alert;