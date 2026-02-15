const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class ActionHistory {
    static async getAll(options = {}) {
        const {
            page = 1,
            limit = 10,
            search = '',
            filterType = '',
            orderBy = 'created_at',
            orderDirection = 'DESC',
        } = options;

        const offset = (page - 1) * limit;
        let whereConditions = [];
        let queryParams = [];

        // Search based on filterType
        if (search) {
            if (filterType === 'name') {
                whereConditions.push('d.name LIKE ?');
                queryParams.push(`%${search}%`);
            } else if (filterType === 'action') {
                whereConditions.push('ah.command LIKE ?');
                queryParams.push(`%${search}%`);
            } else if (filterType === 'status') {
                whereConditions.push('ah.status LIKE ?');
                queryParams.push(`%${search}%`);
            } else if (filterType === 'user') {
                whereConditions.push('ah.executor LIKE ?');
                queryParams.push(`%${search}%`);
            } else if (filterType === 'time') {
                // Format datetime to DD/MM/YYYY HH:MM:SS for search
                whereConditions.push('DATE_FORMAT(ah.created_at, "%d/%m/%Y %H:%i:%s") LIKE ?');
                queryParams.push(`%${search}%`);
            } else {
                // Search all fields including formatted time
                whereConditions.push('(d.name LIKE ? OR ah.command LIKE ? OR ah.executor LIKE ? OR ah.status LIKE ? OR DATE_FORMAT(ah.created_at, "%d/%m/%Y %H:%i:%s") LIKE ?)');
                queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
            }
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        // Count total
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total 
            FROM action_history ah
            LEFT JOIN devices d ON ah.device_id = d.id
            ${whereClause}`,
            queryParams
        );
        const total = countResult[0].total;

        // Get data with pagination
        const [rows] = await db.query(
            `SELECT 
                ah.id,
                d.name as device_name,
                ah.command as value,
                ah.status,
                ah.executor,
                DATE_ADD(ah.created_at, INTERVAL 7 HOUR) as timestamp,
                CASE 
                    WHEN ah.command IN ('ENABLE_AUTO', 'DISABLE_AUTO') THEN ah.command
                    ELSE NULL
                END as auto_toggle
            FROM action_history ah
            LEFT JOIN devices d ON ah.device_id = d.id
            ${whereClause}
            ORDER BY ah.${orderBy} ${orderDirection}
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

    static async getStatistics() {
        const [rows] = await db.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(DISTINCT device_id) as unique_devices,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
                SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as waiting_count
            FROM action_history
        `);
        return rows[0];
    }

    static async getById(id) {
        const [rows] = await db.query(
            `SELECT ah.*, 
                d.name as device_name,
                DATE_ADD(ah.created_at, INTERVAL 7 HOUR) as timestamp
            FROM action_history ah
            LEFT JOIN devices d ON ah.device_id = d.id
            WHERE ah.id = ?`,
            [id]
        );
        return rows[0];
    }

    static async getByDeviceId(deviceId, limit = 50) {
        const [rows] = await db.query(
            `SELECT *, 
                DATE_ADD(created_at, INTERVAL 7 HOUR) as timestamp 
            FROM action_history 
            WHERE device_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?`,
            [deviceId, limit]
        );
        return rows;
    }

    static async getByExecutor(executor, limit = 50) {
        const [rows] = await db.query(
            `SELECT ah.*, 
                d.name as device_name,
                DATE_ADD(ah.created_at, INTERVAL 7 HOUR) as timestamp
            FROM action_history ah
            LEFT JOIN devices d ON ah.device_id = d.id
            WHERE ah.executor = ? 
            ORDER BY ah.created_at DESC 
            LIMIT ?`,
            [executor, limit]
        );
        return rows;
    }

    static async getByStatus(status, limit = 50) {
        const [rows] = await db.query(
            `SELECT ah.*, 
                d.name as device_name,
                DATE_ADD(ah.created_at, INTERVAL 7 HOUR) as timestamp
            FROM action_history ah
            LEFT JOIN devices d ON ah.device_id = d.id
            WHERE ah.status = ? 
            ORDER BY ah.created_at DESC 
            LIMIT ?`,
            [status, limit]
        );
        return rows;
    }

    static async create(actionData) {
        const id = uuidv4();
        const { device_id, command, executor, status } = actionData;
        
        await db.query(
            'INSERT INTO action_history (id, device_id, command, executor, status) VALUES (?, ?, ?, ?, ?)',
            [id, device_id, command, executor, status]
        );
        
        return this.getById(id);
    }

    static async updateStatus(id, status) {
        await db.query('UPDATE action_history SET status = ? WHERE id = ?', [status, id]);
        return this.getById(id);
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM action_history WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async deleteOldActions(days = 90) {
        const [result] = await db.query(
            'DELETE FROM action_history WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
            [days]
        );
        return result.affectedRows;
    }

    static async getByDateRange(startDate, endDate) {
        const [rows] = await db.query(
            `SELECT ah.*, 
                d.name as device_name,
                DATE_ADD(ah.created_at, INTERVAL 7 HOUR) as timestamp
            FROM action_history ah
            LEFT JOIN devices d ON ah.device_id = d.id
            WHERE ah.created_at BETWEEN ? AND ?
            ORDER BY ah.created_at DESC`,
            [startDate, endDate]
        );
        return rows;
    }

    static async getStatistics() {
        const [rows] = await db.query(
            `SELECT 
                command,
                status,
                COUNT(*) as count,
                DATE_ADD(created_at, INTERVAL 7 HOUR) as date
            FROM action_history
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY command, status, DATE(created_at)
            ORDER BY date DESC`
        );
        return rows;
    }
}

module.exports = ActionHistory;