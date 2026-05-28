const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const dbPath = process.env.SQLITE_DB_PATH || './data/dev.sqlite';
let db;

async function getDb() {
  if (!db) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    db = await open({ filename: dbPath, driver: sqlite3.Database });
  }
  return db;
}

async function ensureDatabase() {
  const database = await getDb();
  await database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'User',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function query(sql, params = []) {
  const database = await getDb();
  return database.all(sql, params);
}

module.exports = { ensureDatabase, query };
