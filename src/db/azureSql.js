const sql = require('mssql');

let pool;

function buildConfig() {
  return {
    server: process.env.AZURE_SQL_SERVER,
    database: process.env.AZURE_SQL_DATABASE,
    user: process.env.AZURE_SQL_USER,
    password: process.env.AZURE_SQL_PASSWORD,
    options: {
      encrypt: process.env.AZURE_SQL_ENCRYPT !== 'false',
      trustServerCertificate: false
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };
}

async function getPool() {
  if (!pool) {
    pool = await sql.connect(buildConfig());
  }
  return pool;
}

async function ensureDatabase() {
  const database = await getPool();
  await database.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
    BEGIN
      CREATE TABLE dbo.users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(128) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        display_name NVARCHAR(128) NOT NULL,
        role NVARCHAR(64) NOT NULL DEFAULT 'User',
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
      );
    END
  `);
}

function normalizeSqliteQuery(sqlText) {
  // Placeholder conversion for simple local queries.
  // For production, prefer explicit parameter names in repositories/services.
  let index = 0;
  return sqlText.replace(/\?/g, () => `@p${index++}`);
}

async function query(sqlText, params = []) {
  const database = await getPool();
  const request = database.request();
  params.forEach((value, index) => request.input(`p${index}`, value));
  const result = await request.query(normalizeSqliteQuery(sqlText));
  return result.recordset || [];
}

module.exports = { ensureDatabase, query };
