import type { Category } from '../types';
import { CategoryIcon } from './Icons';
import './CategoryGrid.css';

interface Props {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function CategoryGrid({ categories, selectedId, onSelect }: Props) {
  return (
    <div className="category-grid">
      {categories.map(cat => (
        <button
          key={cat.id}
          className={`category-tile ${selectedId === cat.id ? 'selected' : ''}`}
          onClick={() => onSelect(cat.id)}
        >
          <span className="category-icon">
            <CategoryIcon id={cat.icon} size={26} />
          </span>
          <span className="category-name">{cat.name}</span>
        </button>
      ))}
    </div>
  );
}
