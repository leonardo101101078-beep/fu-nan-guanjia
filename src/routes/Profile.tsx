import { useState, useEffect, useCallback } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import type { Transaction, Category, SavingsGoal, FixedExpense } from '../types';
import {
  getTransactionsByMonth, getAllCategories, getAllGoals,
  addGoal, updateGoal, deleteGoal, getAllTransactions,
  getBudget, setBudget,
  getAllFixedExpenses, addFixedExpense, deleteFixedExpense,
} from '../db/indexedDb';
import { currentYearMonth, formatMonthDisplay } from '../utils/date';
import { formatAmount } from '../utils/format';
import { exportTransactionsXlsx } from '../features/export/exportXlsx';
import { IconDownload, IconTrash } from '../components/Icons';
import './Profile.css';

interface Props {
  onToggleDark: () => void;
  darkMode: boolean;
}

export default function Profile({ onToggleDark, darkMode }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [budgetAmount, setBudgetAmount] = useState(0);

  // Goal editor
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Fixed expense editor
  const [showFixedModal, setShowFixedModal] = useState(false);
  const [fixedName, setFixedName] = useState('');
  const [fixedAmount, setFixedAmount] = useState('');

  // Budget editor
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  // Export range
  const [exportFrom, setExportFrom] = useState(currentYearMonth());
  const [exportTo,   setExportTo]   = useState(currentYearMonth());

  const ym = currentYearMonth();

  const loadData = useCallback(async () => {
    const [txs, cats, gs, allTxs, bgt, fes] = await Promise.all([
      getTransactionsByMonth(ym),
      getAllCategories(),
      getAllGoals(),
      getAllTransactions(),
      getBudget(ym),
      getAllFixedExpenses(),
    ]);
    setTransactions(txs);
    setCategories(cats);
    setGoals(gs);
    setAllTransactions(allTxs);
    setBudgetAmount(bgt?.amount ?? 0);
    setFixedExpenses(fes);
  }, [ym]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalExpense  = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncome   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalFixed    = fixedExpenses.reduce((s, f) => s + f.amount, 0);
  const balance       = totalIncome - totalExpense;
  const remaining     = budgetAmount - totalExpense - totalFixed;

  // ── Export ──
  const handleExport = async () => {
    await exportTransactionsXlsx(
      allTransactions, categories,
      exportFrom, exportTo,
      goals, budgetAmount, fixedExpenses,
    );
  };

  // ── Goals ──
  const openNewGoal = () => {
    setEditingGoal(null);
    setGoalName('');
    setGoalTarget('');
    setGoalDate('');
    setShowGoalModal(true);
  };

  const openEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setGoalTarget(goal.targetAmount.toString());
    setGoalDate(goal.targetDate ?? '');
    setShowGoalModal(true);
  };

  const handleGoalSave = async () => {
    const target = parseFloat(goalTarget);
    if (!goalName || isNaN(target) || target <= 0) return;
    if (editingGoal) {
      await updateGoal({ ...editingGoal, name: goalName, targetAmount: target, targetDate: goalDate || undefined });
    } else {
      await addGoal({
        id: crypto.randomUUID(),
        name: goalName,
        targetAmount: target,
        savedAmount: 0,
        targetDate: goalDate || undefined,
        currency: 'SGD',
        createdAt: Date.now(),
      });
    }
    setShowGoalModal(false);
    loadData();
  };

  const handleGoalDelete = async (id: string) => {
    if (confirm('確定要刪除這個目標嗎？')) {
      await deleteGoal(id);
      loadData();
    }
  };

  // ── Fixed Expenses ──
  const handleFixedSave = async () => {
    const amt = parseFloat(fixedAmount);
    if (!fixedName || isNaN(amt) || amt <= 0) return;
    await addFixedExpense({
      id: crypto.randomUUID(),
      name: fixedName,
      amount: amt,
      currency: 'SGD',
      createdAt: Date.now(),
    });
    setShowFixedModal(false);
    setFixedName('');
    setFixedAmount('');
    loadData();
  };

  const handleFixedDelete = async (id: string) => {
    if (confirm('確定要刪除這個固定支出嗎？')) {
      await deleteFixedExpense(id);
      loadData();
    }
  };

  // ── Budget ──
  const handleBudgetSave = async () => {
    const amount = parseFloat(budgetInput);
    if (!isNaN(amount) && amount >= 0) {
      await setBudget({ yearMonth: ym, amount });
      setBudgetAmount(amount);
    }
    setShowBudgetModal(false);
  };

  // ── Goal countdown helper ──
  const goalCountdown = (goal: SavingsGoal) => {
    if (!goal.targetDate) return { percent: 0, daysLeft: null };
    const created  = new Date(goal.createdAt);
    const target   = parseISO(goal.targetDate);
    const today    = new Date();
    const total    = differenceInDays(target, created);
    const elapsed  = differenceInDays(today, created);
    const daysLeft = differenceInDays(target, today);
    const percent  = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
    return { percent, daysLeft };
  };

  return (
    <div className="profile-page">
      {/* Header with dark mode toggle */}
      <div className="profile-header">
        <h2 className="profile-title">個人</h2>
        <button className="theme-toggle-btn" onClick={onToggleDark}>
          {darkMode ? '淺色' : '深色'}
        </button>
      </div>

      {/* Monthly Balance Card */}
      <div className="profile-card">
        <div className="profile-card-header">
          <span>本月結餘 ({formatMonthDisplay(ym)})</span>
        </div>
        <div className={`profile-balance ${balance >= 0 ? 'positive' : 'negative'}`}>
          {balance >= 0 ? '+' : ''}{formatAmount(balance)}
        </div>
        <div className="profile-balance-detail">
          <span className="detail-income">收入 {formatAmount(totalIncome)}</span>
          <span className="detail-expense">支出 {formatAmount(totalExpense)}</span>
        </div>
      </div>

      {/* Budget Card */}
      <div className="profile-card">
        <div className="profile-card-header">
          <span>月預算</span>
          <button className="profile-edit-btn" onClick={() => {
            setBudgetInput(budgetAmount.toString());
            setShowBudgetModal(true);
          }}>編輯</button>
        </div>
        <div className="profile-budget-value">
          {budgetAmount > 0 ? formatAmount(budgetAmount) : '尚未設定'}
        </div>
        {budgetAmount > 0 && (
          <div className="profile-budget-bar">
            <div
              className="profile-budget-fill"
              style={{ width: `${Math.min(100, ((totalExpense + totalFixed) / budgetAmount) * 100)}%` }}
            />
          </div>
        )}
        {budgetAmount > 0 && (
          <div className="profile-budget-label">
            已花費 {formatAmount(totalExpense + totalFixed)} / {formatAmount(budgetAmount)}
            　剩餘 <strong>{formatAmount(Math.max(0, remaining))}</strong>
          </div>
        )}
      </div>

      {/* Fixed Expenses */}
      <div className="profile-card">
        <div className="profile-card-header">
          <span>固定支出</span>
          <button className="profile-add-btn" onClick={() => { setFixedName(''); setFixedAmount(''); setShowFixedModal(true); }}>+ 新增</button>
        </div>
        {fixedExpenses.length === 0 ? (
          <div className="profile-empty">尚未設定固定支出</div>
        ) : (
          <>
            <div className="fixed-list">
              {fixedExpenses.map(fe => (
                <div key={fe.id} className="fixed-item">
                  <span className="fixed-name">{fe.name}</span>
                  <span className="fixed-amount">{formatAmount(fe.amount)}</span>
                  <button className="fixed-delete" onClick={() => handleFixedDelete(fe.id)}>
                    <IconTrash size={15} />
                  </button>
                </div>
              ))}
            </div>
            <div className="fixed-total">每月合計　{formatAmount(totalFixed)}</div>
          </>
        )}
      </div>

      {/* Savings Goals */}
      <div className="profile-card">
        <div className="profile-card-header">
          <span>存錢目標</span>
          <button className="profile-add-btn" onClick={openNewGoal}>+ 新增</button>
        </div>
        {goals.length === 0 ? (
          <div className="profile-empty">尚未設定存錢目標</div>
        ) : (
          <div className="goals-list">
            {goals.map(goal => {
              const { percent, daysLeft } = goalCountdown(goal);
              return (
                <div key={goal.id} className="goal-item" onClick={() => openEditGoal(goal)}>
                  <div className="goal-header">
                    <span className="goal-name">{goal.name}</span>
                    <button className="goal-delete" onClick={e => {
                      e.stopPropagation();
                      handleGoalDelete(goal.id);
                    }}>
                      <IconTrash size={16} />
                    </button>
                  </div>
                  {goal.targetDate && (
                    <div className="goal-bar">
                      <div className={`goal-fill ${daysLeft !== null && daysLeft < 0 ? 'overdue' : ''}`}
                           style={{ width: `${percent}%` }} />
                    </div>
                  )}
                  <div className="goal-values">
                    <span className="goal-amount">{formatAmount(goal.targetAmount)}</span>
                    {goal.targetDate && (
                      <span className="goal-date">
                        {daysLeft !== null && daysLeft >= 0
                          ? `剩 ${daysLeft} 天`
                          : daysLeft !== null
                          ? `已過期 ${Math.abs(daysLeft)} 天`
                          : ''}
                        　{goal.targetDate}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Export */}
      <div className="profile-card export-card">
        <div className="profile-card-header">
          <span>導出 Excel</span>
        </div>
        <div className="export-range">
          <span className="export-range-label">從</span>
          <input type="month" className="export-month-input" value={exportFrom}
            onChange={e => setExportFrom(e.target.value)} />
          <span className="export-range-label">到</span>
          <input type="month" className="export-month-input" value={exportTo}
            onChange={e => setExportTo(e.target.value)} />
        </div>
        <button className="profile-export-btn" onClick={handleExport}>
          <IconDownload size={18} />
          下載報表
        </button>
      </div>

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{editingGoal ? '編輯目標' : '新增目標'}</h3>
            <input className="modal-input" placeholder="目標名稱"
              value={goalName} onChange={e => setGoalName(e.target.value)} autoFocus />
            <input className="modal-input" type="number" placeholder="目標金額 (SGD)"
              value={goalTarget} onChange={e => setGoalTarget(e.target.value)} />
            <label className="modal-label">目標日期</label>
            <input className="modal-input" type="date"
              value={goalDate} onChange={e => setGoalDate(e.target.value)} />
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowGoalModal(false)}>取消</button>
              <button className="modal-btn confirm" onClick={handleGoalSave}>確定</button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Expense Modal */}
      {showFixedModal && (
        <div className="modal-overlay" onClick={() => setShowFixedModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>新增固定支出</h3>
            <input className="modal-input" placeholder="名稱（如：房租）"
              value={fixedName} onChange={e => setFixedName(e.target.value)} autoFocus />
            <input className="modal-input" type="number" placeholder="每月金額 (SGD)"
              value={fixedAmount} onChange={e => setFixedAmount(e.target.value)} />
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowFixedModal(false)}>取消</button>
              <button className="modal-btn confirm" onClick={handleFixedSave}>確定</button>
            </div>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="modal-overlay" onClick={() => setShowBudgetModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>設定月預算</h3>
            <input className="modal-input" type="number"
              value={budgetInput} onChange={e => setBudgetInput(e.target.value)}
              placeholder="輸入預算金額" autoFocus />
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowBudgetModal(false)}>取消</button>
              <button className="modal-btn confirm" onClick={handleBudgetSave}>確定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
