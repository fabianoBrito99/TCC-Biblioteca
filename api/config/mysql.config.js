// /srv/apps/biblioteca/api/mysql.config.js
require('dotenv').config();
const mysql = require('mysql2');

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'bibli',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'biblioteca_tcc',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
};

// Log rápido só pra diagnosticar (remova depois se quiser)
console.log('[DB] host=', config.host, 'user=', config.user);

const pool = mysql.createPool(config);
module.exports = pool;
