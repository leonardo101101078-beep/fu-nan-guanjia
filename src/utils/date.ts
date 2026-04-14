import { format, addDays, subDays, startOfMonth, endOfMonth, getDay, parse } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import type { Transaction } from '../types';

const DAY_NAMES_ZH = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

export function formatDateDisplay(dateStr: string): string {
  const date = parse(dateStr, 'yyyy-MM-dd', new Date());
  const formatted = format(date, 'yyyy/MM/dd');
  const dayName = DAY_NAMES_ZH[getDay(date)];
  return `${formatted} ${dayName}`;
}

export function formatMonthDisplay(yearMonth: string): string {
  const date = parse(yearMonth + '-01', 'yyyy-MM-dd', new Date());
  return format(date, 'yyyy年M月', { locale: zhTW });
}

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function currentYearMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function nextDay(dateStr: string): string {
  const date = parse(dateStr, 'yyyy-MM-dd', new Date());
  return format(addDays(date, 1), 'yyyy-MM-dd');
}

export function prevDay(dateStr: string): string {
  const date = parse(dateStr, 'yyyy-MM-dd', new Date());
  return format(subDays(date, 1), 'yyyy-MM-dd');
}

export function nextMonth(yearMonth: string): string {
  const date = parse(yearMonth + '-01', 'yyyy-MM-dd', new Date());
  const next = addDays(endOfMonth(date), 1);
  return format(next, 'yyyy-MM');
}

export function prevMonth(yearMonth: string): string {
  const date = parse(yearMonth + '-01', 'yyyy-MM-dd', new Date());
  const prev = subDays(date, 1);
  return format(prev, 'yyyy-MM');
}

export function getMonthDateRange(yearMonth: string): { start: string; end: string } {
  const date = parse(yearMonth + '-01', 'yyyy-MM-dd', new Date());
  return {
    start: format(startOfMonth(date), 'yyyy-MM-dd'),
    end: format(endOfMonth(date), 'yyyy-MM-dd'),
  };
}

export function isTodayStr(dateStr: string): boolean {
  return dateStr === todayStr();
}

export function groupByDate(transactions: Transaction[]): Map<string, Transaction[]> {
  const map = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    if (!map.has(tx.date)) map.set(tx.date, []);
    map.get(tx.date)!.push(tx);
  }
  return map;
}
