import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Transaction, Category, MonthlyBudget, SavingsGoal, FixedExpense } from '../types';

// icon field is now an SVG icon key (maps to CategoryIcon in Icons.tsx)
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food',         name: '飲食', icon: 'food',         type: 'expense', color: '#FF6B35' },
  { id: 'drinks',       name: '飲品', icon: 'drink',        type: 'expense', color: '#F4A261' },
  { id: 'transport',    name: '交通', icon: 'transport',    type: 'expense', color: '#E9C46A' },
  { id: 'social',       name: '社交', icon: 'social',       type: 'expense', color: '#A8C5A0' },
  { id: 'rent',         name: '房租', icon: 'rent',         type: 'expense', color: '#88B4C8' },
  { id: 'other',        name: '其他', icon: 'other',        type: 'both',    color: '#B8A9C9' },
  { id: 'groceries',    name: '雜貨', icon: 'grocery',      type: 'expense', color: '#C49A8A' },
  { id: 'travel',       name: '旅行', icon: 'travel',       type: 'expense', color: '#7EC8A4' },
  { id: 'phone',        name: '手機', icon: 'phone',        type: 'expense', color: '#9BB8D4' },
  { id: 'clothing',     name: '衣物', icon: 'clothing',     type: 'expense', color: '#D4A9C3' },
  { id: 'medical',      name: '醫療', icon: 'medical',      type: 'expense', color: '#A8D4B5' },
  { id: 'subscription', name: '訂閱', icon: 'subscription', type: 'expense', color: '#C4A882' },
  { id: 'salary',       name: '薪資', icon: 'salary',       type: 'income',  color: '#4A90D9' },
  { id: 'bonus',        name: '獎金', icon: 'bonus',        type: 'income',  color: '#7BA7BC' },
  { id: 'investment',   name: '投資', icon: 'investment',   type: 'income',  color: '#7BA7BC' },
  { id: 'sidejob',      name: '副業', icon: 'side-job',     type: 'income',  color: '#4A90D9' },
  { id: 'other-income', name: '其他', icon: 'other',        type: 'income',  color: '#B8A9C9' },
];

interface FuNanDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: {
      'by-date': string;
      'by-type': string;
    };
  };
  categories: {
    key: string;
    value: Category;
  };
  monthlyBudgets: {
    key: string;
    value: MonthlyBudget;
  };
  savingsGoals: {
    key: string;
    value: SavingsGoal;
  };
  fixedExpenses: {
    key: string;
    value: FixedExpense;
  };
}

let dbPromise: Promise<IDBPDatabase<FuNanDB>>;

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<FuNanDB>('FuNanGuanjia', 3, {
      upgrade(db, oldVersion, _newVersion, tx) {
        // Version 1 → create all stores from scratch
        if (oldVersion < 1) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('by-date', 'date');
          txStore.createIndex('by-type', 'type');

          db.createObjectStore('monthlyBudgets', { keyPath: 'yearMonth' });
          db.createObjectStore('savingsGoals', { keyPath: 'id' });

          const catStore = db.createObjectStore('categories', { keyPath: 'id' });
          DEFAULT_CATEGORIES.forEach(cat => catStore.add(cat));
        }

        // Version 2 → re-seed categories replacing emoji icons with SVG icon keys
        if (oldVersion === 1) {
          const catStore = tx.objectStore('categories');
          catStore.clear();
          DEFAULT_CATEGORIES.forEach(cat => catStore.add(cat));
        }

        // Version 3 → add fixedExpenses store
        if (oldVersion < 3) {
          db.createObjectStore('fixedExpenses', { keyPath: 'id' });
        }
      }
    });
  }
  return dbPromise;
}

// --- Transactions ---
export async function addTransaction(tx: Transaction): Promise<void> {
  const db = await getDb();
  await db.add('transactions', tx);
}

export async function updateTransaction(tx: Transaction): Promise<void> {
  const db = await getDb();
  await db.put('transactions', tx);
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('transactions', id);
}

export async function getTransactionsByMonth(yearMonth: string): Promise<Transaction[]> {
  const db = await getDb();
  const start = `${yearMonth}-01`;
  const end = `${yearMonth}-31`;
  const range = IDBKeyRange.bound(start, end);
  const results = await db.getAllFromIndex('transactions', 'by-date', range);
  return results.sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.createdAt - a.createdAt;
  });
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDb();
  return db.getAll('transactions');
}

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDb();
  return db.getAll('categories');
}

// --- Monthly Budget ---
export async function getBudget(yearMonth: string): Promise<MonthlyBudget | undefined> {
  const db = await getDb();
  return db.get('monthlyBudgets', yearMonth);
}

export async function setBudget(budget: MonthlyBudget): Promise<void> {
  const db = await getDb();
  await db.put('monthlyBudgets', budget);
}

// --- Savings Goals ---
export async function getAllGoals(): Promise<SavingsGoal[]> {
  const db = await getDb();
  return db.getAll('savingsGoals');
}

export async function addGoal(goal: SavingsGoal): Promise<void> {
  const db = await getDb();
  await db.add('savingsGoals', goal);
}

export async function updateGoal(goal: SavingsGoal): Promise<void> {
  const db = await getDb();
  await db.put('savingsGoals', goal);
}

export async function deleteGoal(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('savingsGoals', id);
}

// --- Fixed Expenses ---
export async function getAllFixedExpenses(): Promise<FixedExpense[]> {
  const db = await getDb();
  return db.getAll('fixedExpenses');
}

export async function addFixedExpense(fe: FixedExpense): Promise<void> {
  const db = await getDb();
  await db.add('fixedExpenses', fe);
}

export async function deleteFixedExpense(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('fixedExpenses', id);
}
