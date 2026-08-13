const { Pool } = require('pg');

const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || process.env.DB_URL;

if (!connectionString) {
  console.error('Nenhuma conexão Postgres configurada (POSTGRES_URL / DATABASE_URL).');
  if (process.env.VERCEL !== '1' && process.env.ELECTRON_MODE !== '1') {
    process.exit(1);
  }
}

const pool = new Pool({
  connectionString,
  max: Number(process.env.PG_POOL_MAX || 5),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: connectionString && (connectionString.includes('localhost') || connectionString.includes('127.0.0.1'))
    ? undefined
    : { rejectUnauthorized: false },
});

async function all(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows;
}

async function get(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows[0];
}

async function run(text, params = []) {
  return pool.query(text, params);
}

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      description TEXT NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      place TEXT DEFAULT '',
      note TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS transaction_items (
      id SERIAL PRIMARY KEY,
      transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      amount DOUBLE PRECISION NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      "limit" DOUBLE PRECISION NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(user_id, category)
    );

    CREATE TABLE IF NOT EXISTS goals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '🏆',
      target DOUBLE PRECISION NOT NULL,
      current DOUBLE PRECISION DEFAULT 0,
      deadline TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS members (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      relation TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transaction_items_tx ON transaction_items(transaction_id);
    CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);
    CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_members_user ON members(user_id);
  `);
}

module.exports = { pool, all, get, run, init };
