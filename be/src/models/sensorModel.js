const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class SensorModel {
  static async findById(id) {
    const [rows] = await db.query(
      'SELECT * FROM sensors WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM sensors WHERE 1=1';
    const params = [];

    if (filters.device_id) {
      query += ' AND device_id = ?';
      params.push(filters.device_id);
    }

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(filters.limit), parseInt(filters.offset || 0));
    }

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async findByDeviceId(device_id) {
    const [rows] = await db.query(
      'SELECT * FROM sensors WHERE device_id = ?',
      [device_id]
    );
    return rows;
  }

  static async create(sensorData) {
    const {
      device_id,
      name,
      type,
      unit,
      threshold_min,
      threshold_max
    } = sensorData;

    // Generate UUID if not provided
    const id = sensorData.id || uuidv4();

    const [result] = await db.query(
      `INSERT INTO sensors 
       (id, device_id, name, type, unit, threshold_min, threshold_max, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, device_id, name, type, unit, threshold_min || null, threshold_max || null]
    );

    return this.getById(id);
  }

  static async update(id, sensorData) {
    const {
      name,
      type,
      unit,
      threshold_min,
      threshold_max
    } = sensorData;

    const [result] = await db.query(
      `UPDATE sensors 
       SET name = ?, type = ?, unit = ?, 
           threshold_min = ?, threshold_max = ?, 
           updated_at = NOW() 
       WHERE id = ?`,
      [name, type, unit, threshold_min || null, threshold_max || null, id]
    );

    if (result.affectedRows === 0) {
      throw new Error('Sensor not found or no changes made');
    }

    return this.getById(id);
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM sensors WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async updateThresholds(id, threshold_min, threshold_max) {
    const [result] = await db.query(
      'UPDATE sensors SET threshold_min = ?, threshold_max = ?, updated_at = NOW() WHERE id = ?',
      [threshold_min, threshold_max, id]
    );
    return result.affectedRows > 0;
  }

  // CRUD methods for admin
  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      orderBy = 'created_at',
      orderDir = 'DESC',
      filters = {}
    } = options;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];

    // Search by name or id
    if (search) {
      whereConditions.push('(s.name LIKE ? OR s.id LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Filter by device_id
    if (filters.device_id) {
      whereConditions.push('s.device_id = ?');
      queryParams.push(filters.device_id);
    }

    // Filter by type
    if (filters.type) {
      whereConditions.push('s.type = ?');
      queryParams.push(filters.type);
    }

    // Filter by name
    if (filters.name) {
      whereConditions.push('s.name LIKE ?');
      queryParams.push(`%${filters.name}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ') 
      : '';

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total 
       FROM sensors s 
       ${whereClause}`,
      queryParams
    );
    const totalItems = countResult[0].total;

    // Get paginated data
    const [rows] = await db.query(
      `SELECT s.* 
       FROM sensors s
       ${whereClause}
       ORDER BY s.${orderBy} ${orderDir} 
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

  static async getById(id) {
    return this.findById(id);
  }

  static async getByDeviceId(deviceId) {
    return this.findByDeviceId(deviceId);
  }
}

module.exports = SensorModel;