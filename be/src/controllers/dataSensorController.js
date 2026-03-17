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

const NUMERIC_FILTER_COLUMN_MAP = {
    temperature: 'g.temperature',
    humidity: 'g.humidity',
    light: 'g.light',
    gas: 'g.gas'
};

const SENSOR_TYPE_CONDITIONS = {
    temperature: "(LOWER(s.name) LIKE '%temp%' OR LOWER(s.name) LIKE '%nhiet%')",
    humidity: "(LOWER(s.name) LIKE '%hum%' OR LOWER(s.name) LIKE '%am%')",
    light: "(LOWER(s.name) LIKE '%light%' OR LOWER(s.name) LIKE '%anh%' OR LOWER(s.name) LIKE '%anh sang%' OR LOWER(s.name) LIKE '%ánh%' OR LOWER(s.name) LIKE '%sáng%' OR LOWER(s.name) LIKE '%ldr%')",
    gas: "(LOWER(s.name) LIKE '%gas%' OR LOWER(s.name) LIKE '%khi%')"
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

const parseTimeSearchKeyword = (value) => {
    const keyword = String(value || '').trim().replace(',', ' ');
    if (!keyword) {
        return null;
    }

    const secondDmyMatch = keyword.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
    if (secondDmyMatch) {
        const [, day, month, year, hour, minute, second] = secondDmyMatch;
        return { type: 'second', value: `${year}-${month}-${day} ${hour}:${minute}:${second}` };
    }

    const minuteDmyMatch = keyword.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
    if (minuteDmyMatch) {
        const [, day, month, year, hour, minute] = minuteDmyMatch;
        return { type: 'minute', value: `${year}-${month}-${day} ${hour}:${minute}` };
    }

    const dayDmyMatch = keyword.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dayDmyMatch) {
        const [, day, month, year] = dayDmyMatch;
        return { type: 'day', value: `${year}-${month}-${day}` };
    }

    const secondYmdMatch = keyword.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
    if (secondYmdMatch) {
        const [, year, month, day, hour, minute, second] = secondYmdMatch;
        return { type: 'second', value: `${year}-${month}-${day} ${hour}:${minute}:${second}` };
    }

    const minuteYmdMatch = keyword.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
    if (minuteYmdMatch) {
        const [, year, month, day, hour, minute] = minuteYmdMatch;
        return { type: 'minute', value: `${year}-${month}-${day} ${hour}:${minute}` };
    }

    const dayYmdMatch = keyword.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dayYmdMatch) {
        const [, year, month, day] = dayYmdMatch;
        return { type: 'day', value: `${year}-${month}-${day}` };
    }

    return null;
};

const buildTimeCondition = (column, parsedTime) => {
    if (!parsedTime) {
        return null;
    }

    if (parsedTime.type === 'day') {
        return {
            sql: `DATE(${column}) = ?`,
            param: parsedTime.value
        };
    }

    if (parsedTime.type === 'minute') {
        return {
            sql: `DATE_FORMAT(${column}, '%Y-%m-%d %H:%i') = ?`,
            param: parsedTime.value
        };
    }

    return {
        sql: `DATE_FORMAT(${column}, '%Y-%m-%d %H:%i:%s') = ?`,
        param: parsedTime.value
    };
};

const parseNumericKeyword = (value) => {
    const normalized = String(value || '').trim().replace(',', '.');
    if (!normalized) {
        return null;
    }

    if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
        return null;
    }

    return Number(normalized);
};

const buildWhereClause = ({ search = '', filter = 'all' } = {}) => {
    const conditions = [];
    const params = [];

    const keyword = String(search).trim();
    const filterKey = String(filter || 'all').trim();
    const parsedTime = parseTimeSearchKeyword(keyword);
    const timeCondition = buildTimeCondition('g.timestamp', parsedTime);

    if (!keyword) {
        return {
            whereClause: '',
            whereParams: []
        };
    }

    const wildcard = `%${keyword}%`;

    const numericColumn = NUMERIC_FILTER_COLUMN_MAP[filterKey];
    const numericKeyword = parseNumericKeyword(keyword);

    if (numericColumn && numericKeyword !== null) {
        // Compare at 1 decimal to match what UI displays (e.g. 31.0).
        conditions.push(`ROUND(CAST(${numericColumn} AS DECIMAL(18,6)), 1) = ROUND(?, 1)`);
        params.push(numericKeyword);

        return {
            whereClause: `WHERE ${conditions.join(' AND ')}`,
            whereParams: params
        };
    }

    if (filterKey === 'time') {
        if (timeCondition) {
            conditions.push(timeCondition.sql);
            params.push(timeCondition.param);
        } else {
            conditions.push(SEARCH_FILTER_MAP.time);
            params.push(wildcard);
        }

        return {
            whereClause: `WHERE ${conditions.join(' AND ')}`,
            whereParams: params
        };
    }

    if (SEARCH_FILTER_MAP[filterKey]) {
        conditions.push(SEARCH_FILTER_MAP[filterKey]);
        params.push(wildcard);
    } else {
        const allConditions = [
            'CAST(g.temperature AS CHAR) LIKE ?',
            'CAST(g.humidity AS CHAR) LIKE ?',
            'CAST(g.light AS CHAR) LIKE ?',
            'CAST(g.gas AS CHAR) LIKE ?'
        ];

        params.push(wildcard, wildcard, wildcard, wildcard);

        if (timeCondition) {
            allConditions.push(timeCondition.sql);
            params.push(timeCondition.param);
        } else {
            allConditions.push("DATE_FORMAT(g.timestamp, '%Y-%m-%d %H:%i:%s') LIKE ?");
            params.push(wildcard);
        }

        conditions.push(`(${allConditions.join(' OR ')})`);
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
