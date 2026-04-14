export function formatAmount(amount: number): string {
  return '$' + new Intl.NumberFormat('zh-TW', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatAmountSigned(amount: number, type: 'expense' | 'income'): string {
  const sign = type === 'expense' ? '-' : '+';
  return `$${sign}${new Intl.NumberFormat('zh-TW', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount)}`;
}
