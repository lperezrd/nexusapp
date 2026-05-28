const { queryOne } = require('../db');

async function findUserByUsername(username) {
  return queryOne('SELECT * FROM users WHERE lower(username) = lower(?)', [username]);
}

module.exports = { findUserByUsername };
