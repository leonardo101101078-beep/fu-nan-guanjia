import type { Transaction, Category } from '../types';
import { formatDateDisplay, groupByDate } from '../utils/date';
import { formatAmountSigned } from '../utils/format';
import { deleteTransaction } from '../db/indexedDb';
import { CategoryIcon } from './Icons';
import './TransactionList.css';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onUpdate: () => void;
}

export default function TransactionList({ transactions, categories, onUpdate }: Props) {
  const grouped = groupByDate(transactions);
  const catMap = new Map(categories.map(c => [c.id, c]));

  const handleDelete = async (id: string) => {
    if (confirm('確定要刪除這筆記錄嗎？')) {
      await deleteTransaction(id);
      onUpdate();
    }
  };

  if (transactions.length === 0) {
    return <div className="tx-empty">目前沒有記錄</div>;
  }

  return (
    <div className="tx-list">
      {Array.from(grouped.entries()).map(([date, txs]) => {
        const dayTotal = txs.reduce((sum, tx) =>
          sum + (tx.type === 'expense' ? -tx.amount : tx.amount), 0);

        return (
          <div key={date} className="tx-day-group">
            <div className="tx-day-header">
              <span>{formatDateDisplay(date)}</span>
              <span className={`tx-day-total ${dayTotal >= 0 ? 'income' : 'expense'}`}>
                ${dayTotal >= 0 ? '+' : ''}{dayTotal.toFixed(1)}
              </span>
            </div>
            {txs.map(tx => {
              const cat = catMap.get(tx.categoryId);
              return (
                <div
                  key={tx.id}
                  className="tx-row"
                  onClick={() => handleDelete(tx.id)}
                >
                  <span className={`tx-row-icon ${tx.type}`}>
                    <CategoryIcon id={cat?.icon ?? 'other'} size={20} />
                  </span>
                  <div className="tx-row-info">
                    <span className="tx-row-name">{cat?.name || tx.categoryId}</span>
                    {tx.note && <span className="tx-row-note">{tx.note}</span>}
                  </div>
                  <span className={`tx-row-amount ${tx.type}`}>
                    {formatAmountSigned(tx.amount, tx.type)}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
