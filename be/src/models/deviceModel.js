const db = require('../config/db');
const {v4: uuidv4} = require('uuid');

class Device {
    static async getAll(options = {}){
        const {
            page = 1,
            limit = 10,
            search = '',
            orderBy = 'created_at',
            orderDir = 'DESC',
            filter={}
        } = options;

        const offset = (page -  1) * limit
        let whereConditions = []
        let queryParams = []

        if (search) {
            whereConditions.push('(d.name LIKE ? or d.id LIKE ?)')
            queryParams.push(`%${search}%`, `%${search}%`)
        }

        if (filter.status !== undefined) {
            whereConditions.push('d.status = ?')
            queryParams.push(filter.status)
        }

        if (filter.is_connected !== undefined) {
            whereConditions.push('d.is_connected = ?')
            queryParams.push(filter.is_connected)
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''

        const [countResult] = await db.query(
            `SELECT COUNT(*) as total 
            FROM devices d 
            ${whereClause}`,
            queryParams
        );
        const totalItems = countResult[0].total;
        
        const [rows] = await db.query(
            `SELECT d.* 
            FROM devices d
            ${whereClause}
            ORDER BY d.${orderBy} ${orderDir} 
            LIMIT ? OFFSET ?`,
            [...queryParams, parseInt(limit), parseInt(offset)]
        );
        return {
            data: rows,
            pagination: {
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: parseInt(page),
                pageSize: parseInt(limit)
            }
        };
    }

    static async getById(id){
        const [rows] = await db.execute('SELECT * FROM devices WHERE id = ?', [id]);
        return rows[0];
    }

    static async create(name, state){
        const id = uuidv4();
        const [result] = await db.execute(
            'INSERT INTO devices (id, name, status, is_connected) VALUES (?, ?, ?, ?)',
            [id, name, state, false]
        );
        return this.getById(id);
    }

    static async update(id, deviceData){
        const {name, status, is_connected} = deviceData;
        const update = []
        const values = []

        if (name !== undefined) {
            update.push('name = ?');
            values.push(name);
        }
        if (status !== undefined) {
            update.push('status = ?');
            values.push(status);
        }
        if (is_connected !== undefined) {
            update.push('is_connected = ?');
            values.push(is_connected);
        }
        if (update.length === 0) {
            throw new Error('No fields to update');
        }
        values.push(id);

        await db.query('UPDATE devices SET ' + update.join(', ') + ' WHERE id = ?', values);
        return this.getById(id);
     }

    static async delete(id){
        const [result] = await db.execute('DELETE FROM devices WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async updateStatus(id, status){
        await db.execute('UPDATE devices SET status = ? WHERE id = ?', [status, id]);
        return this.getById(id);
    }

    static async updateConnection(id , is_connected){
        await db.execute('UPDATE devices SET is_connected = ? WHERE id = ?', [is_connected, id]);
        return this.getById(id);
    }

    static async getWithSensors(id){
        const [rows] = await db.execute(
            `SELECT d.*, 
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', s.id,
                        'name', s.name,
                        'unit', s.unit,
                        'threshold_min', s.threshold_min,
                        'threshold_max', s.threshold_max
                    )
                ) as sensors
            FROM devices d
            LEFT JOIN sensors s ON d.id = s.device_id
            WHERE d.id = ?
            GROUP BY d.id`,
            [id]
        );
        return rows[0];
    }

    static async getAllDevicesInfo(){
        const [rows] = await db.query(
            `SELECT d.*, 
            (SELECT COUNT(*) FROM sensors WHERE device_id = d.id) as sensor_count
            FROM devices d
            ORDER BY d.created_at DESC
            `
        );
        return rows;
    }

    static async findById(id){
        const [rows] = await db.execute('SELECT * FROM devices WHERE id = ?', [id]);
        return rows[0];
    }
}

module.exports = Device;