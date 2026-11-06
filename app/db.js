const { Pool } = require('pg');

const schema = process.env.DB_SCHEMA;
if (schema && !/^health_test_[a-f0-9]{32}$/.test(schema)) throw new Error("DB_SCHEMA is restricted to generated local test schemas");

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'healthcare_quality',
  user: process.env.DB_USER || process.env.USER,
  password: process.env.DB_PASSWORD || undefined,
  options: schema ? `-c search_path=${schema}` : undefined
});

// Export pool for reuse across the application
module.exports = pool;