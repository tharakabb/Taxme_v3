import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve('taxme.db');

let db: Database.Database;

try {
  db = new Database(dbPath);
} catch (error: any) {
  if (error.code === 'SQLITE_NOTADB') {
    console.warn('Database file corrupted. Deleting and recreating...');
    fs.unlinkSync(dbPath);
    db = new Database(dbPath);
  } else {
    throw error;
  }
}

// Initialize Database
export function initDb() {
  // Check if we need to migrate from the old email-based schema
  const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
  const hasEmail = tableInfo.some(col => col.name === 'email');
  const hasName = tableInfo.some(col => col.name === 'name');

  if (hasEmail && !hasName) {
    console.log('Old schema detected. Migrating users table...');
    db.transaction(() => {
      db.exec(`
        ALTER TABLE users RENAME TO users_old;
        CREATE TABLE users (
          id TEXT PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          pin_hash TEXT NOT NULL,
          user_type TEXT NOT NULL,
          tin TEXT,
          period_code TEXT DEFAULT '25260',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        -- Try to migrate existing users if possible, using email as name
        INSERT INTO users (id, name, pin_hash, user_type, tin, period_code, created_at)
        SELECT id, email, password, user_type, tin, period_code, created_at FROM users_old;
        DROP TABLE users_old;
      `);
    })();
  } else if (hasEmail && hasName) {
    // If both exist, we might be in a half-migrated state where email is still NOT NULL
    // Let's just ensure we can work with it. 
    // Actually, the best is to just remove the email column if we are moving to name-only.
    console.log('Cleaning up old email column...');
    try {
      db.transaction(() => {
        db.exec(`
          ALTER TABLE users RENAME TO users_old;
          CREATE TABLE users (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            pin_hash TEXT NOT NULL,
            user_type TEXT NOT NULL,
            tin TEXT,
            period_code TEXT DEFAULT '25260',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          INSERT INTO users (id, name, pin_hash, user_type, tin, period_code, created_at)
          SELECT id, name, pin_hash, user_type, tin, period_code, created_at FROM users_old;
          DROP TABLE users_old;
        `);
      })();
    } catch (e) {
      console.error('Migration cleanup failed:', e);
    }
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      pin_hash TEXT NOT NULL,
      user_type TEXT NOT NULL, -- 'personal', 'sole_prop', 'pvt_ltd'
      tin TEXT,
      period_code TEXT DEFAULT '25260',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrations for existing DB
  try { db.exec("ALTER TABLE transactions ADD COLUMN category TEXT;"); } catch(e) {}
  try { db.exec("ALTER TABLE transactions ADD COLUMN description TEXT;"); } catch(e) {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_categories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- 'revenue', 'expense'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, name, type),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      vendor TEXT,
      amount REAL NOT NULL,
      type TEXT NOT NULL, -- 'revenue', 'expense'
      category TEXT,
      description TEXT,
      receipt_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- 'property', 'vehicle', 'investment', 'rent'
      value REAL NOT NULL,
      acquisition_date TEXT,
      income_generated REAL DEFAULT 0, -- For rent or investment income
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS salary_configs (
      user_id TEXT PRIMARY KEY,
      basic_salary REAL DEFAULT 0,
      allowances REAL DEFAULT 0,
      deductions REAL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  console.log('Database initialized successfully at', dbPath);
}

export default db;
