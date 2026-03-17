const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
	host: process.env.DB_HOST || 'localhost',
	port: Number(process.env.DB_PORT || 3306),
	user: process.env.DB_USER || 'root',
	password: process.env.DB_PASSWORD || '',
	database: process.env.DB_NAME || '',
	timezone: '+07:00',
	waitForConnections: true,
	connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
	queueLimit: 0
});

pool.on('connection', (connection) => {
	connection.query("SET time_zone = '+07:00'", (error) => {
		if (error) {
			console.error('Cannot set MySQL session timezone to +07:00:', error.message);
		}
	});
});

const query = async (sql, params = []) => {
	const [rows] = await pool.execute(sql, params);
	return rows;
};

module.exports = {
	pool,
	query
};
