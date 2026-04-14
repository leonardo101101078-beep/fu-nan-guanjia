export interface Transaction {
  id: string;
  type: 'expense' | 'income';
  categoryId: string;
  amount: number;
  currency: string;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'expense' | 'income' | 'both';
  color: string;
}

export interface MonthlyBudget {
  yearMonth: string; // YYYY-MM
  amount: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate?: string;   // YYYY-MM-DD (新增：目標日期)
  currency: string;
  createdAt: number;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  currency: string;
  createdAt: number;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  total: number;
  percentage: number;
}
