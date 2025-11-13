import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  ssl: process.env.PGHOST?.includes('azure') ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = (text, params) => pool.query(text, params);

export default pool;
