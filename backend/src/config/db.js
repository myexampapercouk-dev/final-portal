const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edu_portal',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Log the config being used at boot (password redacted) so it's visible in
// runtime logs whether the right values actually loaded from the environment.
console.log('[DB CONFIG]', {
  host: config.host,
  port: config.port,
  user: config.user,
  database: config.database,
  password: config.password ? `set (${config.password.length} chars)` : 'MISSING'
});

const pool = mysql.createPool(config);

// Fire a real connection test at boot so a bad host/user/password shows up
// immediately in the logs, instead of only surfacing on the first API call.
pool.getConnection()
  .then((conn) => {
    console.log('[DB CONNECTION] Success — connected to', config.host, '/', config.database);
    conn.release();
  })
  .catch((err) => {
    console.error('[DB CONNECTION] FAILED:', err.code, '-', err.message);
  });

module.exports = pool;