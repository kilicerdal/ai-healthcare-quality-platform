const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'healthcare_quality',
  user: process.env.DB_USER || process.env.USER,
  password: process.env.DB_PASSWORD || undefined
});

// Export pool for reuse across the application
module.exports = pool;