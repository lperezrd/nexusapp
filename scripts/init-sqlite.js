require('dotenv').config();

const bcrypt = require('bcryptjs');
const { ensureDatabase } = require('../src/db');
const sqlite = require('../src/db/sqlite');

async function run() {
  process.env.DB_PROVIDER = 'sqlite';
  await ensureDatabase();

  const existing = await sqlite.query('SELECT * FROM users WHERE username = ?', ['admin']);
  if (existing.length > 0) {
    console.log('Default admin user already exists.');
    return;
  }

  const hash = await bcrypt.hash('Password123!', 12);
  const db = await require('sqlite').open({
    filename: process.env.SQLITE_DB_PATH || './data/dev.sqlite',
    driver: require('sqlite3').Database
  });

  await db.run(
    'INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)',
    ['admin', hash, 'System Administrator', 'Administrator']
  );

  console.log('Created default user: admin / Password123!');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
