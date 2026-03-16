const { query } = require('../config/db');

const ORDER_MAP = {
    asc: 'ASC',
    desc: 'DESC'
};

const SEARCH_FILTER_MAP = {
    name: 'COALESCE(d.name, s.name) LIKE ?',
    severity: 'a.severity LIKE ?',
    time: "DATE_FORMAT(a.created_at, '%Y-%m-%d %H:%i:%s') LIKE ?",
    title: 'a.title LIKE ?',
    description: 'a.description LIKE ?'
};

const SEVERITY_COUNT_SQL = `
    COUNT(*) AS total_count,
    SUM(CASE WHEN LOWER(severity) IN ('high', 'critical', 'danger') THEN 1 ELSE 0 END) AS high_count,
    SUM(CASE WHEN LOWER(severity) IN ('medium', 'warning') THEN 1 ELSE 0 END) AS medium_count,
    SUM(CASE WHEN LOWER(severity) IN ('low', 'info', 'information') THEN 1 ELSE 0 END) AS low_count,
    SUM(CASE WHEN LOWER(severity) = 'normal' THEN 1 ELSE 0 END) AS normal_count
`;

const buildWhereClause = ({ search = '', filter = 'all' } = {}) => {
    const keyword = String(search || '').trim();
    const filterKey = String(filter || 'all').trim();

    if (!keyword) {
        return {
            whereClause: '',
            whereParams: []
        };
    }

    const wildcard = `%${keyword}%`;

    if (SEARCH_FILTER_MAP[filterKey]) {
        return {
            whereClause: `WHERE ${SEARCH_FILTER_MAP[filterKey]}`,
            whereParams: [wildcard]
        };
    }

    return {
        whereClause: `WHERE (
            COALESCE(d.name, s.name) LIKE ?
            OR a.title LIKE ?
            OR a.description LIKE ?
            OR a.severity LIKE ?
            OR DATE_FORMAT(a.created_at, '%Y-%m-%d %H:%i:%s') LIKE ?
        )`,
        whereParams: [wildcard, wildcard, wildcard, wildcard, wildcard]
    };
};

const normalizeDate = (value) => {
    if (!value) {
        return new Date().toISOString().slice(0, 10);
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed.toISOString().slice(0, 10);
};

const createDateRange = (days) => {
    const dates = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i -= 1) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date.toISOString().slice(0, 10));
    }

    return dates;
};

const getAllAlerts = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
        const offset = (page - 1) * limit;

        const orderInput = String(req.query.order || 'desc').toLowerCase();
        const order = ORDER_MAP[orderInput] || ORDER_MAP.desc;

        const { whereClause, whereParams } = buildWhereClause(req.query);

        const dataSql = `
            SELECT
                a.id,
                a.sensor_id,
                a.device_id,
                d.name AS device_name,
                s.name AS sensor_name,
                a.title,
                a.description,
                a.severity,
                a.created_at AS timestamp
            FROM alerts a
            LEFT JOIN devices d ON d.id = a.device_id
            LEFT JOIN sensors s ON s.id = a.sensor_id
            ${whereClause}
            ORDER BY a.created_at ${order}
            LIMIT ${limit} OFFSET ${offset}
        `;

        const countSql = `
            SELECT COUNT(*) AS total
            FROM alerts a
            LEFT JOIN devices d ON d.id = a.device_id
            LEFT JOIN sensors s ON s.id = a.sensor_id
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
        console.error('Error while fetching alerts:', error);
        return res.status(500).json({
            success: false,
            message: 'Khong the tai danh sach canh bao',
            error: error.message
        });
    }
};

const getDailyCount = async (req, res) => {
    try {
        const date = normalizeDate(req.query.date);

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Dinh dang date khong hop le. Vi du: 2026-03-17'
            });
        }

        const sql = `
            SELECT
                ${SEVERITY_COUNT_SQL}
            FROM alerts
            WHERE DATE(created_at) = ?
        `;

        const rows = await query(sql, [date]);
        const item = rows?.[0] || {};

        return res.status(200).json({
            success: true,
            data: {
                date,
                total_count: Number(item.total_count || 0),
                high_count: Number(item.high_count || 0),
                medium_count: Number(item.medium_count || 0),
                low_count: Number(item.low_count || 0),
                normal_count: Number(item.normal_count || 0)
            }
        });
    } catch (error) {
        console.error('Error while fetching daily alert counts:', error);
        return res.status(500).json({
            success: false,
            message: 'Khong the tai thong ke canh bao theo ngay',
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
                ${SEVERITY_COUNT_SQL}
            FROM alerts
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) ASC
        `;

        const rows = await query(sql, [days - 1]);
        const mapByDate = new Map(
            rows.map((row) => {
                const date = String(row.date).slice(0, 10);
                return [
                    date,
                    {
                        date,
                        total_count: Number(row.total_count || 0),
                        high_count: Number(row.high_count || 0),
                        medium_count: Number(row.medium_count || 0),
                        low_count: Number(row.low_count || 0),
                        normal_count: Number(row.normal_count || 0)
                    }
                ];
            })
        );

        const data = createDateRange(days).map((date) => {
            return mapByDate.get(date) || {
                date,
                total_count: 0,
                high_count: 0,
                medium_count: 0,
                low_count: 0,
                normal_count: 0
            };
        });

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error while fetching alert count by days:', error);
        return res.status(500).json({
            success: false,
            message: 'Khong the tai thong ke canh bao theo nhieu ngay',
            error: error.message
        });
    }
};

module.exports = {
    getAllAlerts,
    getDailyCount,
    getCountByDays
};
