import { formatDateDisplay, todayStr, nextDay, prevDay, isTodayStr } from '../utils/date';
import { IconCalendar, IconChevronLeft, IconChevronRight } from './Icons';
import './DateNavigator.css';

interface Props {
  date: string;
  onChange: (date: string) => void;
}

export default function DateNavigator({ date, onChange }: Props) {
  const isToday = isTodayStr(date);

  return (
    <div className="date-navigator">
      <button className="date-nav-arrow" onClick={() => onChange(prevDay(date))}>
        <IconChevronLeft size={18} />
      </button>
      <button className="date-nav-center" onClick={() => onChange(todayStr())}>
        <IconCalendar size={16} className="date-nav-icon" />
        <span>{isToday ? '今日 ' : ''}{formatDateDisplay(date)}</span>
      </button>
      <button
        className="date-nav-arrow"
        onClick={() => onChange(nextDay(date))}
        disabled={isToday}
      >
        <IconChevronRight size={18} />
      </button>
    </div>
  );
}
