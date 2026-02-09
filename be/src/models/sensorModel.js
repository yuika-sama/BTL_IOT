const db = require('../config/db');
const {v4: uuidv4} = require('uuid');

class Sensor{
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

        // Search
        if (search) {
            whereConditions.push('(s.name LIKE ? OR s.id LIKE ? OR d.name LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Filters
        if (filters.device_id) {
            whereConditions.push('s.device_id = ?');
            queryParams.push(filters.device_id);
        }
        if (filters.name) {
            whereConditions.push('s.name = ?');
            queryParams.push(filters.name);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        // Count total
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM sensors s
            LEFT JOIN devices d ON s.device_id = d.id
            ${whereClause}`,
            queryParams
        );
        const total = countResult[0].total;

        // Get data with pagination
        const [rows] = await db.query(
            `SELECT s.*, d.name as device_name, d.type as device_type 
            FROM sensors s 
            LEFT JOIN devices d ON s.device_id = d.id 
            ${whereClause}
            ORDER BY s.${orderBy} ${orderDirection}
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

    static async getById(id){
        const [rows] = await db.query(
            `SELECT s.*, d.name as device_name, d.type as device_type 
            FROM sensors s 
            LEFT JOIN devices d ON s.device_id = d.id 
            WHERE s.id = ?`,
            [id]
        );
        return rows[0];
    }

    static async getByDeviceId(device_id){
        const [rows] = await db.query(
            `SELECT * FROM sensors WHERE device_id = ? ORDER BY created_at DESC`,
            [device_id]
        );
        return rows;
    }

    static async create(sensorData){
        const id = uuidv4();
        const {device_id, name, unit, threshold_min=0, threshold_max=100} = sensorData;
        await db.query('INSERT INTO sensors (id, device_id, name, unit, threshold_min, threshold_max) VALUES (?, ?, ?, ?, ?, ?)',
            [id, device_id, name, unit, threshold_min, threshold_max]
        );
        return this.getById(id);
    }

    static async update(id, sensorData){
        const {name, unit, threshold_min, threshold_max} = sensorData;
        const update = [];
        const values = [];

        if (name !== undefined) {
            update.push('name = ?');
            values.push(name);
        }
        if (unit !== undefined) {
            update.push('unit = ?');
            values.push(unit);
        }
        if (threshold_min !== undefined) {
            update.push('threshold_min = ?');
            values.push(threshold_min);
        }
        if (threshold_max !== undefined) {
            update.push('threshold_max = ?');
            values.push(threshold_max);
        }
        if (update.length === 0) {
            throw new Error('No fields to update');
        }
        values.push(id);

        await db.query('UPDATE sensors SET ' + update.join(', ') + ' WHERE id = ?', values);
        return this.getById(id);
    }

    static async delete(id){
        const [result] = await db.execute('DELETE FROM sensors WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    // Dashboard: Get latest values for 4 sensors in last 10 minutes
    static async getLatestValuesByIds(sensorIds){
        const placeholders = sensorIds.map(() => '?').join(',');
        const [rows] = await db.query(
            `SELECT 
                s.id as sensor_id,
                s.name as sensor_name,
                s.unit,
                ds.value,
                ds.created_at as timestamp
            FROM sensors s
            LEFT JOIN (
                SELECT sensor_id, value, created_at,
                    ROW_NUMBER() OVER (PARTITION BY sensor_id ORDER BY created_at DESC) as rn
                FROM data_sensors
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
            ) ds ON s.id = ds.sensor_id AND ds.rn = 1
            WHERE s.id IN (${placeholders})
            ORDER BY s.name`,
            sensorIds
        );
        return rows;
    }
}

module.exports = Sensor;