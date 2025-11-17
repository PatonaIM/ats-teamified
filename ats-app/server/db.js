import pg from 'pg';
const { Pool } = pg;

// SSL Configuration for Azure PostgreSQL
// SECURITY WARNING: rejectUnauthorized: false is INSECURE and only for local development
// For production, you MUST:
// 1. Download Azure CA bundle: https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/how-to-connect-tls-ssl
// 2. Use: ssl: { ca: fs.readFileSync('/path/to/DigiCertGlobalRootCA.crt.pem'), rejectUnauthorized: true }
// 3. Set NODE_ENV=production

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Prevent production launch with insecure SSL
if (isProduction && process.env.PGHOST?.includes('azure')) {
  console.error('FATAL: Cannot connect to Azure PostgreSQL in production mode without proper SSL certificate validation.');
  console.error('Please configure ssl.ca with Azure CA bundle and set rejectUnauthorized: true');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  ssl: process.env.PGHOST ? {
    rejectUnauthorized: false  // Allow self-signed certificates in development
    // For Azure production: ca: fs.readFileSync('./certs/DigiCertGlobalRootCA.crt.pem'), rejectUnauthorized: true
  } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = (text, params) => pool.query(text, params);

export default pool;
