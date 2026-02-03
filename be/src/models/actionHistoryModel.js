const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class ActionHistory {
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
                whereConditions.push('TIME(ah.created_at) = ?');
                queryParams.push(search);
            } else if (timeParts.length === 2) {
                // Exact minute: HH:MM
                whereConditions.push('DATE_FORMAT(ah.created_at, "%H:%i") = ?');
                queryParams.push(search);
            } else if (timeParts.length === 1 && search.length <= 2) {
                // Hour: HH
                whereConditions.push('HOUR(ah.created_at) = ?');
                queryParams.push(parseInt(search));
            } else {
                // General search
                whereConditions.push('(d.name LIKE ? OR ah.command LIKE ? OR ah.executor LIKE ?)');
                queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }
        }

        // Filters
        if (filters.device_id) {
            whereConditions.push('ah.device_id = ?');
            queryParams.push(filters.device_id);
        }
        if (filters.status) {
            whereConditions.push('ah.status = ?');
            queryParams.push(filters.status);
        }
        if (filters.command) {
            whereConditions.push('ah.command = ?');
            queryParams.push(filters.command);
        }
        if (filters.executor) {
            whereConditions.push('ah.executor = ?');
            queryParams.push(filters.executor);
        }
        if (filters.startDate && filters.endDate) {
            whereConditions.push('ah.created_at BETWEEN ? AND ?');
            queryParams.push(filters.startDate, filters.endDate);
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
                ah.created_at as timestamp
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

    static async getById(id) {
        const [rows] = await db.query(
            `SELECT ah.*, d.name as device_name, d.type as device_type
            FROM action_history ah
            LEFT JOIN devices d ON ah.device_id = d.id
            WHERE ah.id = ?`,
            [id]
        );
        return rows[0];
    }

    static async getByDeviceId(deviceId, limit = 50) {
        const [rows] = await db.query(
            'SELECT * FROM action_history WHERE device_id = ? ORDER BY created_at DESC LIMIT ?',
            [deviceId, limit]
        );
        return rows;
    }

    static async getByExecutor(executor, limit = 50) {
        const [rows] = await db.query(
            `SELECT ah.*, d.name as device_name
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
            `SELECT ah.*, d.name as device_name
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
            `SELECT ah.*, d.name as device_name
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
                DATE(created_at) as date
            FROM action_history
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY command, status, DATE(created_at)
            ORDER BY date DESC`
        );
        return rows;
    }
}

module.exports = ActionHistory;