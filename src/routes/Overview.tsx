import { useState, useEffect, useCallback } from 'react';
import type { Transaction, Category, CategorySummary, MonthlyBudget, FixedExpense } from '../types';
import { getTransactionsByMonth, getAllCategories, getBudget, setBudget, getAllFixedExpenses } from '../db/indexedDb';
import { currentYearMonth, formatMonthDisplay, nextMonth, prevMonth } from '../utils/date';
import { formatAmount } from '../utils/format';
import DonutChart from '../components/DonutChart';
import TransactionList from '../components/TransactionList';
import { CategoryIcon, IconChevronLeft, IconChevronRight } from '../components/Icons';
import './Overview.css';

function computeSummaries(transactions: Transaction[], categories: Category[], type: 'expense' | 'income'): CategorySummary[] {
  const filtered = transactions.filter(tx => tx.type === type);
  const total = filtered.reduce((s, tx) => s + tx.amount, 0);
  const byCategory = new Map<string, number>();
  for (const tx of filtered) {
    byCategory.set(tx.categoryId, (byCategory.get(tx.categoryId) ?? 0) + tx.amount);
  }
  const catMap = new Map(categories.map(c => [c.id, c]));
  return Array.from(byCategory.entries())
    .map(([catId, sum]) => {
      const cat = catMap.get(catId);
      return {
        categoryId: catId,
        categoryName: cat?.name ?? catId,
        icon: cat?.icon ?? 'other',
        color: cat?.color ?? '#FF6B35',
        total: sum,
        percentage: total > 0 ? (sum / total) * 100 : 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export default function Overview() {
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budget, setBudgetState] = useState<MonthlyBudget | null>(null);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [showExpenseDetail, setShowExpenseDetail] = useState(false);
  const [showIncomeDetail, setShowIncomeDetail] = useState(false);

  const loadData = useCallback(async () => {
    const [txs, cats, bgt, fes] = await Promise.all([
      getTransactionsByMonth(yearMonth),
      getAllCategories(),
      getBudget(yearMonth),
      getAllFixedExpenses(),
    ]);
    setTransactions(txs);
    setCategories(cats);
    setBudgetState(bgt ?? null);
    setFixedExpenses(fes);
  }, [yearMonth]);

  useEffect(() => { loadData(); }, [loadData]);

  const expenseSummaries = computeSummaries(transactions, categories, 'expense');
  const incomeSummaries  = computeSummaries(transactions, categories, 'income');
  const totalExpense     = expenseSummaries.reduce((s, c) => s + c.total, 0);
  const totalIncome      = incomeSummaries.reduce((s, c) => s + c.total, 0);
  const totalFixed       = fixedExpenses.reduce((s, f) => s + f.amount, 0);
  const budgetAmount     = budget?.amount ?? 0;
  const remaining        = budgetAmount - totalExpense - totalFixed;
  const fillPercent      = budgetAmount > 0
    ? Math.max(0, Math.min(100, (remaining / budgetAmount) * 100))
    : 0;

  const isCurrentMonth = yearMonth === currentYearMonth();

  const handleBudgetSave = async () => {
    const amount = parseFloat(budgetInput);
    if (!isNaN(amount) && amount >= 0) {
      await setBudget({ yearMonth, amount });
      setBudgetState({ yearMonth, amount });
    }
    setEditingBudget(false);
  };

  return (
    <div className="overview-page">
      {/* Month Navigation */}
      <div className="month-nav">
        <button className="month-nav-arrow" onClick={() => setYearMonth(prevMonth(yearMonth))}>
          <IconChevronLeft size={18} />
        </button>
        <span className="month-nav-label">{formatMonthDisplay(yearMonth)}</span>
        <button
          className="month-nav-arrow"
          onClick={() => setYearMonth(nextMonth(yearMonth))}
          disabled={isCurrentMonth}
        >
          <IconChevronRight size={18} />
        </button>
      </div>

      {/* Summary Row */}
      <div className="summary-row">
        <div className="summary-item" onClick={() => { setShowExpenseDetail(!showExpenseDetail); setShowIncomeDetail(false); }}>
          <span className="summary-label">月支出 ›</span>
          <span className="summary-value expense">{formatAmount(totalExpense)}</span>
        </div>
        <div className="summary-item" onClick={() => { setShowIncomeDetail(!showIncomeDetail); setShowExpenseDetail(false); }}>
          <span className="summary-label">月收入 ›</span>
          <span className="summary-value income">{formatAmount(totalIncome)}</span>
        </div>
      </div>

      {/* Donut Charts */}
      {showExpenseDetail ? (
        <div className="detail-section">
          <DonutChart data={expenseSummaries} total={totalExpense} label="月支出" />
          <div className="category-breakdown">
            {expenseSummaries.map(s => (
              <div key={s.categoryId} className="breakdown-row">
                <span className="breakdown-icon expense">
                  <CategoryIcon id={s.icon} size={18} />
                </span>
                <span className="breakdown-name">{s.categoryName}</span>
                <span className="breakdown-percent">{s.percentage.toFixed(1)}%</span>
                <span className="breakdown-amount">{formatAmount(s.total)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : showIncomeDetail ? (
        <div className="detail-section">
          <DonutChart data={incomeSummaries} total={totalIncome} label="月收入" />
          <div className="category-breakdown">
            {incomeSummaries.map(s => (
              <div key={s.categoryId} className="breakdown-row">
                <span className="breakdown-icon income">
                  <CategoryIcon id={s.icon} size={18} />
                </span>
                <span className="breakdown-name">{s.categoryName}</span>
                <span className="breakdown-percent">{s.percentage.toFixed(1)}%</span>
                <span className="breakdown-amount">{formatAmount(s.total)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Budget Circle */}
          <div className="budget-section">
            <div className="budget-circle" style={{ '--fill': `${fillPercent}%` } as React.CSSProperties}>
              <div className="budget-circle-inner">
                <div className="budget-label">當月剩餘預算</div>
                <div className="budget-remaining">
                  {budgetAmount > 0 ? formatAmount(Math.max(0, remaining)) : '—'}
                </div>
                <div className="budget-row">
                  <span className="budget-sub-label">已花</span>
                  <span className="budget-sub-val">{formatAmount(totalExpense)}</span>
                </div>
                {totalFixed > 0 && (
                  <div className="budget-row">
                    <span className="budget-sub-label">固定</span>
                    <span className="budget-sub-val fixed">-{formatAmount(totalFixed)}</span>
                  </div>
                )}
                <button
                  className="budget-set-btn"
                  onClick={() => { setBudgetInput(budgetAmount.toString()); setEditingBudget(true); }}
                >
                  {budgetAmount > 0 ? `預算 ${formatAmount(budgetAmount)}` : '點此設定預算'}
                </button>
              </div>
            </div>
          </div>

          {/* Budget Edit Modal */}
          {editingBudget && (
            <div className="modal-overlay" onClick={() => setEditingBudget(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3>設定月預算</h3>
                <input
                  type="number"
                  className="modal-input"
                  value={budgetInput}
                  onChange={e => setBudgetInput(e.target.value)}
                  placeholder="輸入預算金額"
                  autoFocus
                />
                <div className="modal-actions">
                  <button className="modal-btn cancel" onClick={() => setEditingBudget(false)}>取消</button>
                  <button className="modal-btn confirm" onClick={handleBudgetSave}>確定</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Transaction List */}
      <TransactionList
        transactions={transactions}
        categories={categories}
        onUpdate={loadData}
      />
    </div>
  );
}
