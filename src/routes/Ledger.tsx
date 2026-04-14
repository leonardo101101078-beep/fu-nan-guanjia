import { useState, useEffect, useCallback } from 'react';
import type { Transaction, Category } from '../types';
import { DEFAULT_CATEGORIES, addTransaction, getTransactionsByMonth, getAllCategories } from '../db/indexedDb';
import { todayStr, currentYearMonth } from '../utils/date';
import CategoryGrid from '../components/CategoryGrid';
import DateNavigator from '../components/DateNavigator';
import NumericKeypad from '../components/NumericKeypad';
import TransactionList from '../components/TransactionList';
import { CategoryIcon } from '../components/Icons';
import './Ledger.css';

// 收入頁只顯示這三個類別
const INCOME_VISIBLE = ['salary', 'sidejob', 'other-income'];

export default function Ledger() {
  const [activeType, setActiveType] = useState<'expense' | 'income'>('expense');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayStr());
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [toast, setToast] = useState('');
  const [currentAmount, setCurrentAmount] = useState(0);

  const loadData = useCallback(async () => {
    const cats = await getAllCategories();
    if (cats.length > 0) setCategories(cats);
    const txs = await getTransactionsByMonth(currentYearMonth());
    setTransactions(txs);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // 過濾 + 收入限3項 + 其他移末端
  const filteredCategories = categories.filter(c =>
    c.type === activeType || c.type === 'both'
  );

  const visibleCategories = (() => {
    let list = activeType === 'income'
      ? filteredCategories.filter(c => INCOME_VISIBLE.includes(c.id))
      : filteredCategories;

    // 把 id 為 'other' 或 'other-income' 的移到最尾端
    const others = list.filter(c => c.id === 'other' || c.id === 'other-income');
    const rest   = list.filter(c => c.id !== 'other' && c.id !== 'other-income');
    return [...rest, ...others];
  })();

  const handleSave = useCallback(async (amount: number) => {
    if (!selectedCategory || amount <= 0) {
      setToast('請選擇類別並輸入金額');
      setTimeout(() => setToast(''), 2000);
      return;
    }

    const tx: Transaction = {
      id: crypto.randomUUID(),
      type: activeType,
      categoryId: selectedCategory,
      amount: Math.round(amount * 100) / 100,
      currency: 'SGD',
      note,
      date,
      createdAt: Date.now(),
    };

    await addTransaction(tx);
    setNote('');
    setSelectedCategory(null);
    setCurrentAmount(0);
    setToast('已記錄 ✓');
    setTimeout(() => setToast(''), 1500);
    loadData();
  }, [selectedCategory, activeType, note, date, loadData]);

  const selectedCat = categories.find(c => c.id === selectedCategory);

  const dailyTransactions = transactions.filter(t => t.date === date);
  const listTitle = date === todayStr()
    ? '今日記錄'
    : `${date.slice(5, 7)}月${date.slice(8)}日 記錄`;

  return (
    <div className="ledger-page">
      {/* Type Toggle */}
      <div className="type-toggle-wrap">
        <div className="type-toggle">
          <button
            className={`type-btn ${activeType === 'expense' ? 'active' : ''}`}
            onClick={() => { setActiveType('expense'); setSelectedCategory(null); }}
          >
            支出
          </button>
          <button
            className={`type-btn ${activeType === 'income' ? 'active' : ''}`}
            onClick={() => { setActiveType('income'); setSelectedCategory(null); }}
          >
            收入
          </button>
        </div>
      </div>

      {/* Category Grid */}
      <CategoryGrid
        categories={visibleCategories}
        selectedId={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* Entry Preview */}
      <div className="entry-preview">
        <span className="entry-preview-icon">
          <CategoryIcon id={selectedCat?.icon ?? 'other'} size={22} />
        </span>
        <span className="entry-preview-currency">SGD</span>
        {selectedCategory && currentAmount > 0 && (
          <span className="entry-preview-amount">
            {currentAmount.toLocaleString()}
          </span>
        )}
        <div className="entry-preview-divider" />
        <input
          className="entry-preview-note"
          placeholder="輸入備註"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
        <button
          className="entry-add-btn"
          disabled={!selectedCategory || currentAmount <= 0}
          onClick={() => handleSave(currentAmount)}
        >
          新增
        </button>
      </div>

      {/* Date Navigator */}
      <DateNavigator date={date} onChange={setDate} />

      {/* Numeric Keypad — only shown when a category is selected */}
      {selectedCategory && (
        <NumericKeypad
          key={selectedCategory}
          onConfirm={handleSave}
          onChange={setCurrentAmount}
        />
      )}

      {/* Toast */}
      {toast && <div className="ledger-toast">{toast}</div>}

      {/* Daily Transactions */}
      <div className="ledger-recent">
        <h3 className="ledger-recent-title">{listTitle}</h3>
        {dailyTransactions.length > 0 ? (
          <TransactionList
            transactions={dailyTransactions}
            categories={categories}
            onUpdate={loadData}
          />
        ) : (
          <p className="ledger-empty">今天還沒有記錄</p>
        )}
      </div>
    </div>
  );
}
