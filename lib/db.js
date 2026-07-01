const mysql = require('mysql2/promise');

let pool;

function parseUserHost() {
  const userEnv = process.env.MYSQL_USER || '';
  const hostEnv = process.env.MYSQL_HOST || '';

  if (userEnv.includes('@')) {
    const at = userEnv.indexOf('@');
    return {
      user: userEnv.slice(0, at),
      host: userEnv.slice(at + 1) || hostEnv,
    };
  }

  return { user: userEnv, host: hostEnv };
}

function getConfig() {
  const { user, host } = parseUserHost();
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  const port = Number(process.env.MYSQL_PORT || 3306);

  if (!host || !user || !password || !database) {
    throw new Error(
      'MySQL is not configured. Set MYSQL_USER, MYSQL_HOST, MYSQL_PASSWORD, and MYSQL_DATABASE in Vercel (connection identity: user@host).',
    );
  }

  return {
    host,
    user,
    password,
    database,
    port,
    connectionString: `${user}@${host}`,
  };
}

function getPool() {
  if (!pool) {
    const { host, user, password, database, port } = getConfig();
    pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
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
