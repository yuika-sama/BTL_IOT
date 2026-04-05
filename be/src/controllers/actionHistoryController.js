const { query } = require('../config/db');
const { getNormalizedSortOrder, getActionHistorySearchFilter, ACTION_HISTORY_SEARCH_MAP } = require('../utils/sqlMappings');
const { parseTimeSearchKeyword, buildTimeCondition } = require('../utils/timeParser');
const { getAllSensorTypes, getSensorConfig } = require('../utils/sensorConfig');

/**
 * Build sensor filter condition for action history
 * Filters devices by sensor type using device name patterns
 * @param {string} sensorFilter - Sensor type to filter by
 * @returns {object|null} SQL condition object or null
 */
const buildSensorFilterCondition = (sensorFilter = 'all') => {
    const sensorKey = String(sensorFilter || 'all').trim().toLowerCase();
    const config = getSensorConfig(sensorKey);

    if (!config) {
        return null;
    }

    // Map sensor type to device names
    const deviceNameKeywords = {
        humidity: ['%may bom%', '%máy bơm%'],
        gas: ['%khoa gas%', '%khóa gas%'],
        light: ['%quang cam%', '%quang cảm%'],
        temperature: ['%nhiet ke%', '%nhiệt kế%']
    };

    const keywords = deviceNameKeywords[sensorKey];
    if (!keywords || !keywords.length) {
        return null;
    }

    return {
        sql: `(${keywords.map(() => 'LOWER(d.name) LIKE ?').join(' OR ')})`,
        params: keywords
    };
};

/**
 * Build WHERE clause for action history queries
 * Handles search, filter, and sensor filtering
 */
const buildWhereClause = ({ search = '', filter = 'all', sensorFilter = 'all' } = {}) => {
    const conditions = [];
    const params = [];

    const keyword = String(search).trim();
    const filterKey = String(filter || 'all').trim().toLowerCase();
    const wildcard = `%${keyword}%`;
    const parsedTime = parseTimeSearchKeyword(keyword);
    const timeCondition = buildTimeCondition('ah.created_at', parsedTime);
    const sensorCondition = buildSensorFilterCondition(sensorFilter);

    if (keyword) {
        if (filterKey === 'time') {
            if (timeCondition) {
                conditions.push(timeCondition.sql);
                params.push(timeCondition.param);
            } else {
                conditions.push(SEARCH_FILTER_MAP.time);
                params.push(wildcard);
            }
        } else if (SEARCH_FILTER_MAP[filterKey]) {
            conditions.push(SEARCH_FILTER_MAP[filterKey]);
            params.push(wildcard);
        } else {
            const allConditions = [
                'd.name LIKE ?',
                'ah.command LIKE ?',
                'ah.status LIKE ?',
                'ah.executor LIKE ?'
            ];

            params.push(wildcard, wildcard, wildcard, wildcard);

            if (timeCondition) {
                allConditions.push(timeCondition.sql);
                params.push(timeCondition.param);
            } else {
                allConditions.push("DATE_FORMAT(ah.created_at, '%Y-%m-%d %H:%i:%s') LIKE ?");
                params.push(wildcard);
            }

            conditions.push(`(${allConditions.join(' OR ')})`);
        }
    }

    if (sensorCondition) {
        conditions.push(sensorCondition.sql);
        params.push(...sensorCondition.params);
    }

    if (!conditions.length) {
        return { whereClause: '', whereParams: [] };
    }

    return {
        whereClause: `WHERE ${conditions.join(' AND ')}`,
        whereParams: params
    };
};

const getAllActionHistory = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
        const offset = (page - 1) * limit;

        const orderInput = String(req.query.order || 'desc').toLowerCase();
        const sortOrder = getNormalizedSortOrder(orderInput);
        const { whereClause, whereParams } = buildWhereClause(req.query);

        const dataSql = `SELECT 
                ah.id,
                ah.device_id,
                d.name AS device_name,
                ah.command,
                CASE
                    WHEN (
                        UPPER(ah.command) LIKE '%_ON'
                        OR UPPER(ah.command) IN ('ON', 'TURN_ON')
                    ) THEN 'ON'
                    WHEN (
                        UPPER(ah.command) LIKE '%_OFF'
                        OR UPPER(ah.command) IN ('OFF', 'TURN_OFF')
                    ) THEN 'OFF'
                    ELSE NULL
                END AS value,
                ah.executor,
                ah.status,
                ah.created_at AS timestamp
            FROM action_history ah
            LEFT JOIN devices d ON d.id = ah.device_id
             ${whereClause}
            ORDER BY ah.created_at ${sortOrder}
            LIMIT ${limit} OFFSET ${offset}
        `;

        const countSql = `
            SELECT COUNT(*) AS total
            FROM action_history ah
            LEFT JOIN devices d ON d.id = ah.device_id
            ${whereClause}
        `;

        const [rows, countRows] = await Promise.all([
            query(dataSql, whereParams),
            query(countSql, whereParams)
        ]);

        const total = Number(countRows?.[0]?.total || 0);
        const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

        return res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                offset
            }
        });
    } catch (error) {
        console.error('Error while fetching action history:', error);
        return res.status(500).json({
            success: false,
            message: 'Không thể tải lịch sử thao tác',
            error: error.message
        });
    }
};

module.exports = {
    getAllActionHistory
};