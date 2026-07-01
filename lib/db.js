const mysql = require('mysql2/promise');

let pool;

function getConfig() {
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  const port = Number(process.env.MYSQL_PORT || 3306);

  if (!host || !user || !password || !database) {
    throw new Error(
      'MySQL is not configured. Set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE in Vercel.',
    );
  }

  return { host, user, password, database, port };
}

function getPool() {
  if (!pool) {
    const config = getConfig();
    pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 3,
      maxIdle: 1,
      idleTimeout: 10_000,
      enableKeepAlive: true,
      connectTimeout: 10_000,
    });
  }
  return pool;
}

async function query(sql, params = []) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}

module.exports = { query, getConfig };
