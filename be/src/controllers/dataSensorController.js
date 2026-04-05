const { query } = require('../config/db');
const { getNormalizedSortOrder, SENSOR_DATA_SEARCH_MAP, SENSOR_DATA_NUMERIC_FILTER_MAP } = require('../utils/sqlMappings');
const { parseTimeSearchKeyword, buildTimeCondition } = require('../utils/timeParser');
const { getAllSensorTypes, getSensorSqlCondition } = require('../utils/sensorConfig');

/**
 * Build base aggregate SQL dynamically based on sensor configuration
 */
const buildBaseAggregateSql = () => {
    const sensors = getAllSensorTypes();
    const caseStatements = sensors.map(
        (sensorType) => `MAX(CASE WHEN ${getSensorSqlCondition(sensorType)} THEN ds.value END) AS ${sensorType}`
    ).join(',\n        ');

    return `
    SELECT
        MAX(ds.created_at) AS timestamp,
        ${caseStatements}
    FROM data_sensors ds
    INNER JOIN sensors s ON s.id = ds.sensor_id
    GROUP BY DATE_FORMAT(ds.created_at, '%Y-%m-%d %H:%i:%s')
`;
};

/**
 * Parse numeric keyword for filtering
 */
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

    const numericColumn = SENSOR_DATA_NUMERIC_FILTER_MAP[filterKey];
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
            conditions.push(SENSOR_DATA_SEARCH_MAP.time);
            params.push(wildcard);
        }

        return {
            whereClause: `WHERE ${conditions.join(' AND ')}`,
            whereParams: params
        };
    }

    if (SENSOR_DATA_SEARCH_MAP[filterKey]) {
        conditions.push(SENSOR_DATA_SEARCH_MAP[filterKey]);
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
        const sortOrder = getNormalizedSortOrder(orderInput);

        const { whereClause, whereParams } = buildWhereClause(req.query);
        const baseAggregateSql = buildBaseAggregateSql();

        const dataSql = `
            SELECT g.timestamp, g.temperature, g.humidity, g.light, g.gas
            FROM (
                ${baseAggregateSql}
            ) g
            ${whereClause}
            ORDER BY g.timestamp ${sortOrder}
            LIMIT ${limit} OFFSET ${offset}
        `;

        const countSql = `
            SELECT COUNT(*) AS total
            FROM (
                ${baseAggregateSql}
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
