const { query } = require('../config/db');

const ORDER_MAP = {
    asc: 'ASC',
    desc: 'DESC'
};

const SEARCH_FILTER_MAP = {
    temperature: 'CAST(g.temperature AS CHAR) LIKE ?',
    humidity: 'CAST(g.humidity AS CHAR) LIKE ?',
    light: 'CAST(g.light AS CHAR) LIKE ?',
    gas: 'CAST(g.gas AS CHAR) LIKE ?',
    time: "DATE_FORMAT(g.timestamp, '%Y-%m-%d %H:%i:%s') LIKE ?"
};

const SENSOR_TYPE_CONDITIONS = {
    temperature: "(LOWER(s.name) LIKE '%temp%' OR LOWER(s.name) LIKE '%nhiet%')",
    humidity: "(LOWER(s.name) LIKE '%hum%' OR LOWER(s.name) LIKE '%am%')",
    light: "(LOWER(s.name) LIKE '%light%' OR LOWER(s.name) LIKE '%anh%' OR LOWER(s.name) LIKE '%ldr%')",
    gas: "(LOWER(s.name) LIKE '%gas%' OR LOWER(s.name) LIKE '%khí%')"
};

const BASE_AGGREGATE_SQL = `
    SELECT
        DATE_FORMAT(ds.created_at, '%Y-%m-%d %H:%i:%s') AS time_key,
        MAX(ds.created_at) AS timestamp,
        MAX(CASE WHEN ${SENSOR_TYPE_CONDITIONS.temperature} THEN ds.value END) AS temperature,
        MAX(CASE WHEN ${SENSOR_TYPE_CONDITIONS.humidity} THEN ds.value END) AS humidity,
        MAX(CASE WHEN ${SENSOR_TYPE_CONDITIONS.light} THEN ds.value END) AS light,
        MAX(CASE WHEN ${SENSOR_TYPE_CONDITIONS.gas} THEN ds.value END) AS gas
    FROM data_sensors ds
    INNER JOIN sensors s ON s.id = ds.sensor_id
    GROUP BY DATE_FORMAT(ds.created_at, '%Y-%m-%d %H:%i:%s')
`;

const buildWhereClause = ({ search = '', filter = 'all' } = {}) => {
    const conditions = [];
    const params = [];

    const keyword = String(search).trim();
    const filterKey = String(filter || 'all').trim();

    if (!keyword) {
        return {
            whereClause: '',
            whereParams: []
        };
    }

    const wildcard = `%${keyword}%`;

    if (SEARCH_FILTER_MAP[filterKey]) {
        conditions.push(SEARCH_FILTER_MAP[filterKey]);
        params.push(wildcard);
    } else {
        conditions.push(`(
            CAST(g.temperature AS CHAR) LIKE ?
            OR CAST(g.humidity AS CHAR) LIKE ?
            OR CAST(g.light AS CHAR) LIKE ?
            OR CAST(g.gas AS CHAR) LIKE ?
            OR DATE_FORMAT(g.timestamp, '%Y-%m-%d %H:%i:%s') LIKE ?
        )`);
        params.push(wildcard, wildcard, wildcard, wildcard, wildcard);
    }

    return {
        whereClause: `WHERE ${conditions.join(' AND ')}`,
        whereParams: params
    };
};

const sanitizeRow = (row, index, page, limit) => ({
    id: (page - 1) * limit + index + 1,
    temperature: row.temperature !== null ? Number(row.temperature) : null,
    humidity: row.humidity !== null ? Number(row.humidity) : null,
    light: row.light !== null ? Number(row.light) : null,
    gas: row.gas !== null ? Number(row.gas) : null,
    timestamp: row.timestamp
});

const getSensorHistory = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
        const offset = (page - 1) * limit;

        const orderInput = String(req.query.order || 'desc').toLowerCase();
        const sortOrder = ORDER_MAP[orderInput] || ORDER_MAP.desc;

        const { whereClause, whereParams } = buildWhereClause(req.query);

        const dataSql = `
            SELECT g.timestamp, g.temperature, g.humidity, g.light, g.gas
            FROM (
                ${BASE_AGGREGATE_SQL}
            ) g
            ${whereClause}
            ORDER BY g.timestamp ${sortOrder}
            LIMIT ${limit} OFFSET ${offset}
        `;

        const countSql = `
            SELECT COUNT(*) AS total
            FROM (
                ${BASE_AGGREGATE_SQL}
            ) g
            ${whereClause}
        `;

        const [rows, countRows] = await Promise.all([
            query(dataSql, whereParams),
            query(countSql, whereParams)
        ]);

        const total = Number(countRows?.[0]?.total || 0);
        const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
        const data = rows.map((row, index) => sanitizeRow(row, index, page, limit));

        return res.status(200).json({
            success: true,
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                offset
            }
        });
    } catch (error) {
        console.error('Error while fetching data sensor history:', error);
        return res.status(500).json({
            success: false,
            message: 'Không thể tải lịch sử dữ liệu cảm biến',
            error: error.message
        });
    }
};

module.exports = {
    getSensorHistory
};
