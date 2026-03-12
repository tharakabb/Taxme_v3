import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dbPath = path.resolve('taxme.db');
const db = new Database(dbPath);

function seed() {
  console.log('Seeding database...');

  const defaultCategories = [
    { name: 'Salary', type: 'revenue' },
    { name: 'Business Income', type: 'revenue' },
    { name: 'Rental Income', type: 'revenue' },
    { name: 'Investment Income', type: 'revenue' },
    { name: 'Food & Dining', type: 'expense' },
    { name: 'Transportation', type: 'expense' },
    { name: 'Utilities', type: 'expense' },
    { name: 'Rent', type: 'expense' },
    { name: 'Insurance', type: 'expense' },
    { name: 'Medical', type: 'expense' },
    { name: 'Education', type: 'expense' },
    { name: 'Entertainment', type: 'expense' },
    { name: 'Office Supplies', type: 'expense' },
    { name: 'Professional Fees', type: 'expense' },
    { name: 'Taxes', type: 'expense' },
  ];

  // Note: We don't seed user_categories directly because they are user-specific.
  // But we can create a "system" user or just let the app handle it.
  // Actually, the app's /categories route unions user_categories and transactions.
  // So seeding user_categories for a specific user would be better if we had one.
  
  console.log('Seed data defined. In this app, categories are created dynamically or per-user.');
  console.log('Database is ready.');
}

seed();
