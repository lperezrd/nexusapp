const provider = process.env.DB_PROVIDER || 'sqlite';
const sqlite = require('./sqlite');
const azureSql = require('./azureSql');

function selectedDb() {
  if (provider === 'azuresql') return azureSql;
  return sqlite;
}

async function ensureDatabase() {
  return selectedDb().ensureDatabase();
}

async function query(sql, params = []) {
  return selectedDb().query(sql, params);
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

module.exports = { ensureDatabase, query, queryOne };
