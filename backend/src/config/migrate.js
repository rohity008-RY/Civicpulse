const { readFileSync } = require('fs');
const { resolve, dirname } = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: resolve(__dirname, '../../.env') });
require('dotenv').config({ path: resolve(__dirname, '../../../deploy.env') });

async function main() {
  const migrationsDir = resolve(__dirname, 'migrations');
  const path = resolve(migrationsDir, process.argv[2] || '');
  if (!process.argv[2] || dirname(path) !== migrationsDir || !path.endsWith('.sql')) throw new Error('Pass a SQL filename from config/migrations');
  const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Database connection is not configured');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: true, ...(process.env.SUPABASE_CA_FILE ? { ca: readFileSync(process.env.SUPABASE_CA_FILE, 'utf8') } : {}) }, connectionTimeoutMillis: 15000 });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(readFileSync(path, 'utf8'));
    await client.query('COMMIT');
    console.log(`Applied ${process.argv[2]}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { await client.end(); }
}

main().catch(error => { console.error(`Migration failed (${error.code || 'configuration'}). No transaction changes were committed.`); process.exitCode = 1; });
