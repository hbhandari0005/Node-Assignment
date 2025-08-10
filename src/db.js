const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const isRailway = process.env.RAILWAY_ENVIRONMENT !== undefined;

const pool = mysql.createPool({
  host: isRailway ? process.env.DB_HOST : (process.env.DB_HOST || '127.0.0.1'),
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'school_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
