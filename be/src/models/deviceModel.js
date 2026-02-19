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

    static async create(name, value = 0){
        const id = uuidv4();
        const [result] = await db.execute(
            'INSERT INTO devices (id, name, value, status, is_connected) VALUES (?, ?, ?, ?, ?)',
            [id, name, value, 'success', false]
        );
        return this.getById(id);
    }

    static async update(id, deviceData){
        const {name, value, status, is_connected, auto_toggle} = deviceData;
        const update = []
        const values = []

        if (name !== undefined) {
            update.push('name = ?');
            values.push(name);
        }
        if (value !== undefined) {
            update.push('value = ?');
            values.push(value);
        }
        if (status !== undefined) {
            update.push('status = ?');
            values.push(status);
        }
        if (is_connected !== undefined) {
            update.push('is_connected = ?');
            values.push(is_connected);
        }
        if (auto_toggle !== undefined) {
            update.push('auto_toggle = ?');
            values.push(auto_toggle);
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

    static async updateValue(id, value){
        await db.execute('UPDATE devices SET value = ? WHERE id = ?', [value, id]);
        return this.getById(id);
    }

    static async updateValueAndStatus(id, value, status){
        await db.execute('UPDATE devices SET value = ?, status = ? WHERE id = ?', [value, status, id]);
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

    static async getAllDevicesInfo(connectedOnly = false){
        let query = `SELECT d.id, d.name, d.value, d.status, d.is_connected, d.auto_toggle
            FROM devices d`;
        
        if (connectedOnly) {
            query += ' WHERE d.is_connected = 1';
        }
        
        query += ' ORDER BY d.name ASC';
        
        const [rows] = await db.query(query);
        return rows;
    }

    static async findById(id){
        const [rows] = await db.execute('SELECT * FROM devices WHERE id = ?', [id]);
        return rows[0];
    }

    static async updateAutoToggle(id, autoToggle){
        await db.execute('UPDATE devices SET auto_toggle = ? WHERE id = ?', [autoToggle, id]);
        return this.getById(id);
    }

    static async getDevicesWithAutoToggle(){
        const [rows] = await db.query(
            `SELECT d.*, s.id as sensor_id, s.threshold_min, s.threshold_max, s.name as sensor_name
            FROM devices d
            LEFT JOIN sensors s ON s.device_id = d.id
            WHERE d.auto_toggle = 1`
        );
        return rows;
    }

    // Set connection status for devices from ENV
    static async setDevicesConnected(connected = true){
        const deviceIds = [
            process.env.DEVICE_TEMPERATURE_ID,
            process.env.DEVICE_HUMIDITY_ID,
            process.env.DEVICE_LIGHT_ID,
            process.env.DEVICE_DUST_ID
        ].filter(id => id); // Filter out undefined

        if (deviceIds.length === 0) {
            console.warn('⚠️ No device IDs found in environment variables');
            return;
        }

        const placeholders = deviceIds.map(() => '?').join(',');
        await db.query(
            `UPDATE devices SET is_connected = ?, status = ? WHERE id IN (${placeholders})`,
            [connected ? 1 : 0, 'success', ...deviceIds]
        );
        
        console.log(`✅ Updated ${deviceIds.length} devices: is_connected = ${connected}, status = success`);
    }

    // Set all devices disconnected
    static async setAllDevicesDisconnected(){
        await db.query('UPDATE devices SET is_connected = 0, status = ?', ['success']);
        console.log('✅ All devices set to disconnected with status success');
    }

    // Update device with command status (waiting/success/failed)
    static async updateWithCommandStatus(id, data){
        const {value, status} = data;
        const update = [];
        const values = [];

        if (value !== undefined) {
            update.push('value = ?');
            values.push(value);
        }
        if (status !== undefined) {
            update.push('status = ?');
            values.push(status);
        }

        if (update.length === 0) {
            return this.getById(id);
        }

        values.push(id);
        await db.execute('UPDATE devices SET ' + update.join(', ') + ' WHERE id = ?', values);
        return this.getById(id);
    }
}

module.exports = Device;