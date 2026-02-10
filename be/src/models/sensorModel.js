const db = require('../config/db');

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
      id,
      device_id,
      name,
      type,
      unit,
      threshold_min,
      threshold_max
    } = sensorData;

    const [result] = await db.query(
      `INSERT INTO sensors 
       (id, device_id, name, type, unit, threshold_min, threshold_max, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, device_id, name, type, unit, threshold_min || null, threshold_max || null]
    );

    return { id, ...sensorData };
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

    return result.affectedRows > 0;
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
}

module.exports = SensorModel;