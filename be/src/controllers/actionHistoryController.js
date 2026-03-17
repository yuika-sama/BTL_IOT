const { query } = require('../config/db');

const ORDER_MAP = {
    asc: 'ASC',
    desc: 'DESC'
};

const SEARCH_FILTER_MAP = {
    name: 'd.name LIKE ?',
    action: 'ah.command LIKE ?',
    status: 'ah.status LIKE ?',
    user: 'ah.executor LIKE ?',
    time: "DATE_FORMAT(ah.created_at, '%Y-%m-%d %H:%i:%s') LIKE ?"
};

const formatDateToYMD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const buildWhereClause = ({ search = '', filter = 'all' } = {}) => {
    const conditions = [];
    const params = [];

    const keyword = String(search).trim();
    const filterKey = String(filter || 'all').trim();

    if (keyword) {
        const wildcard = `%${keyword}%`;

        if (SEARCH_FILTER_MAP[filterKey]) {
            conditions.push(SEARCH_FILTER_MAP[filterKey]);
            params.push(wildcard);
        } else {
            conditions.push(`(
                d.name LIKE ?
                OR ah.command LIKE ?
                OR ah.status LIKE ?
                OR ah.executor LIKE ?
                OR DATE_FORMAT(ah.created_at, '%Y-%m-%d %H:%i:%s') LIKE ?
            )`);
            params.push(wildcard, wildcard, wildcard, wildcard, wildcard);
        }
    }

    if (!conditions.length) {
        return { whereClause: '', whereParams: [] };
    }

    return {
        whereClause: `WHERE ${conditions.join(' AND ')}`,
        whereParams: params
    };
};

const normalizeDate = (value) => {
    if (!value) {
        return formatDateToYMD(new Date());
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
        return String(value);
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return formatDateToYMD(date);
};

const createDateRange = (days) => {
    const result = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i -= 1) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        result.push(formatDateToYMD(date));
    }

    return result;
};

const getAllActionHistory = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
        const offset = (page - 1) * limit;

        const orderInput = String(req.query.order || 'desc').toLowerCase();
        const sortOrder = ORDER_MAP[orderInput] || ORDER_MAP.desc;
        console.log((req.query.search))
        const { whereClause, whereParams } = buildWhereClause(req.query);

        const dataSql = `SELECT 
                ah.id,
                ah.device_id,
                d.name AS device_name,
                ah.command,
                CASE
                    WHEN UPPER(ah.command) IN ('ENABLE_AUTO', 'AUTO_ENABLE', 'AUTO_ON') THEN 'ENABLE_AUTO'
                    WHEN UPPER(ah.command) IN ('DISABLE_AUTO', 'AUTO_DISABLE', 'AUTO_OFF') THEN 'DISABLE_AUTO'
                    ELSE NULL
                END AS auto_toggle,
                CASE
                    WHEN (
                        (
                            UPPER(ah.command) LIKE '%_ON'
                            OR UPPER(ah.command) IN ('ON', 'TURN_ON')
                        )
                        AND UPPER(ah.command) NOT IN ('ENABLE_AUTO', 'AUTO_ENABLE', 'AUTO_ON')
                    ) THEN 'ON'
                    WHEN (
                        (
                            UPPER(ah.command) LIKE '%_OFF'
                            OR UPPER(ah.command) IN ('OFF', 'TURN_OFF')
                        )
                        AND UPPER(ah.command) NOT IN ('DISABLE_AUTO', 'AUTO_DISABLE', 'AUTO_OFF')
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

const getDailyCount = async (req, res) => {
    try {
        const normalizedDate = normalizeDate(req.query.date);

        if (!normalizedDate) {
            return res.status(400).json({
                success: false,
                message: 'Định dạng date không hợp lệ. Ví dụ: 2026-03-16'
            });
        }

        const sql = `
            SELECT
                SUM(
                    CASE
                        WHEN (
                            (
                                UPPER(command) LIKE '%_ON'
                                OR UPPER(command) IN ('ON', 'TURN_ON')
                            )
                            AND UPPER(command) NOT IN ('ENABLE_AUTO', 'AUTO_ENABLE', 'AUTO_ON')
                        ) THEN 1
                        ELSE 0
                    END
                ) AS on_count,
                SUM(
                    CASE
                        WHEN (
                            (
                                UPPER(command) LIKE '%_OFF'
                                OR UPPER(command) IN ('OFF', 'TURN_OFF')
                            )
                            AND UPPER(command) NOT IN ('DISABLE_AUTO', 'AUTO_DISABLE', 'AUTO_OFF')
                        ) THEN 1
                        ELSE 0
                    END
                ) AS off_count,
                DATE(?) AS date
            FROM action_history
            WHERE DATE(created_at) = ?
        `;

        const rows = await query(sql, [normalizedDate, normalizedDate]);
        const result = rows?.[0] || {};

        return res.status(200).json({
            success: true,
            data: {
                date: normalizedDate,
                on_count: Number(result.on_count || 0),
                off_count: Number(result.off_count || 0)
            }
        });
    } catch (error) {
        console.error('Error while fetching daily action counts:', error);
        return res.status(500).json({
            success: false,
            message: 'Không thể tải thống kê lịch sử thao tác theo ngày',
            error: error.message
        });
    }
};

const getCountByDays = async (req, res) => {
    try {
        const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90);

        const sql = `
            SELECT
                DATE(created_at) AS date,
                SUM(
                    CASE
                        WHEN (
                            (
                                UPPER(command) LIKE '%_ON'
                                OR UPPER(command) IN ('ON', 'TURN_ON')
                            )
                            AND UPPER(command) NOT IN ('ENABLE_AUTO', 'AUTO_ENABLE', 'AUTO_ON')
                        ) THEN 1
                        ELSE 0
                    END
                ) AS on_count,
                SUM(
                    CASE
                        WHEN (
                            (
                                UPPER(command) LIKE '%_OFF'
                                OR UPPER(command) IN ('OFF', 'TURN_OFF')
                            )
                            AND UPPER(command) NOT IN ('DISABLE_AUTO', 'AUTO_DISABLE', 'AUTO_OFF')
                        ) THEN 1
                        ELSE 0
                    END
                ) AS off_count
            FROM action_history
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) ASC
        `;

        const rows = await query(sql, [days - 1]);
        const mapByDate = new Map(
            rows.map((row) => [
                formatDateToYMD(new Date(row.date)),
                {
                    date: formatDateToYMD(new Date(row.date)),
                    on_count: Number(row.on_count || 0),
                    off_count: Number(row.off_count || 0)
                }
            ])
        );

        const data = createDateRange(days).map((date) => {
            return (
                mapByDate.get(date) || {
                    date,
                    on_count: 0,
                    off_count: 0
                }
            );
        });

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error while fetching action count by days:', error);
        return res.status(500).json({
            success: false,
            message: 'Không thể tải thống kê lịch sử thao tác theo nhiều ngày',
            error: error.message
        });
    }
};

module.exports = {
    getAllActionHistory,
    getDailyCount,
    getCountByDays
};