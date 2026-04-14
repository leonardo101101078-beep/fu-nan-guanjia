import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { Transaction, Category, SavingsGoal, FixedExpense } from '../../types';

export async function exportTransactionsXlsx(
  transactions: Transaction[],
  categories: Category[],
  fromYM: string,
  toYM: string,
  goals: SavingsGoal[],
  budgetAmount: number,
  fixedExpenses: FixedExpense[],
) {
  // Filter transactions to the selected date range
  const filtered = transactions.filter(tx => {
    const ym = tx.date.slice(0, 7);
    return ym >= fromYM && ym <= toYM;
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = '富男管家';
  wb.created = new Date();

  const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B35' } };
  const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' } };
  const sectionFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3EE' } };

  // ── Sheet 1: All Transactions ──────────────────────────────
  const sheet1 = wb.addWorksheet('全部交易');
  sheet1.columns = [
    { header: '日期',       key: 'date',     width: 14 },
    { header: '類型',       key: 'type',     width: 8  },
    { header: '類別',       key: 'category', width: 12 },
    { header: '金額(SGD)',  key: 'amount',   width: 14 },
    { header: '備註',       key: 'note',     width: 24 },
    { header: '建立時間',   key: 'createdAt', width: 20 },
  ];

  sheet1.getRow(1).eachCell(cell => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { horizontal: 'center' };
  });

  const catMap = new Map(categories.map(c => [c.id, c]));
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  for (const tx of sorted) {
    const row = sheet1.addRow({
      date: tx.date,
      type: tx.type === 'expense' ? '支出' : '收入',
      category: catMap.get(tx.categoryId)?.name ?? tx.categoryId,
      amount: tx.type === 'expense' ? -tx.amount : tx.amount,
      note: tx.note,
      createdAt: new Date(tx.createdAt).toLocaleString('zh-TW'),
    });
    row.getCell('amount').font = {
      color: { argb: tx.type === 'expense' ? 'FFC0392B' : 'FF2980B9' }
    };
    row.getCell('amount').numFmt = '#,##0.00';
  }

  sheet1.autoFilter = { from: 'A1', to: 'F1' };

  // ── Sheet 2: Monthly Summary ───────────────────────────────
  const sheet2 = wb.addWorksheet('月度摘要');
  const expenseCats = categories.filter(c => c.type === 'expense' || c.type === 'both');

  sheet2.addRow(['月份', '總收入', '總支出', '結餘', ...expenseCats.map(c => c.name)]);
  sheet2.getRow(1).eachCell(cell => {
    cell.font = headerFont;
    cell.fill = headerFill;
    cell.alignment = { horizontal: 'center' };
  });

  const byMonth = new Map<string, Transaction[]>();
  for (const tx of sorted) {
    const ym = tx.date.slice(0, 7);
    if (!byMonth.has(ym)) byMonth.set(ym, []);
    byMonth.get(ym)!.push(tx);
  }

  for (const ym of Array.from(byMonth.keys()).sort()) {
    const txs = byMonth.get(ym)!;
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const catTotals = expenseCats.map(cat =>
      txs.filter(t => t.categoryId === cat.id && t.type === 'expense')
         .reduce((s, t) => s + t.amount, 0)
    );
    const row = sheet2.addRow([ym, income, expense, income - expense, ...catTotals]);
    row.getCell(4).font = {
      color: { argb: income - expense >= 0 ? 'FF2980B9' : 'FFC0392B' },
      bold: true,
    };
    row.getCell(4).numFmt = '#,##0.00';
    row.getCell(2).numFmt = '#,##0.00';
    row.getCell(3).numFmt = '#,##0.00';
  }

  // ── Sheet 3: 摘要 ──────────────────────────────────────────
  const sheet3 = wb.addWorksheet('摘要');
  sheet3.getColumn(1).width = 22;
  sheet3.getColumn(2).width = 18;
  sheet3.getColumn(3).width = 18;

  const addTitle = (text: string) => {
    const row = sheet3.addRow([text]);
    row.getCell(1).fill = headerFill;
    row.getCell(1).font = headerFont;
    row.getCell(1).alignment = { horizontal: 'left' };
    sheet3.mergeCells(row.number, 1, row.number, 3);
  };

  const addSubHeader = (...cells: string[]) => {
    const row = sheet3.addRow(cells);
    row.eachCell(cell => {
      cell.fill = sectionFill;
      cell.font = { bold: true, color: { argb: 'FF5A3010' } };
    });
  };

  // Period overview
  const totalIncome  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalFixed   = fixedExpenses.reduce((s, f) => s + f.amount, 0);
  const balance      = totalIncome - totalExpense;

  addTitle(`匯出期間：${fromYM} ～ ${toYM}`);
  sheet3.addRow([]);
  addSubHeader('項目', '金額 (SGD)', '');

  const addAmt = (label: string, amount: number, isExpense = false) => {
    const row = sheet3.addRow([label, amount]);
    row.getCell(2).numFmt = '#,##0.00';
    row.getCell(2).font = { color: { argb: isExpense ? 'FFC0392B' : 'FF2980B9' } };
  };

  addAmt('期間總收入', totalIncome);
  addAmt('期間總支出', totalExpense, true);
  const balRow = sheet3.addRow(['期間結餘', balance]);
  balRow.getCell(2).numFmt = '#,##0.00';
  balRow.getCell(2).font = { bold: true, color: { argb: balance >= 0 ? 'FF2980B9' : 'FFC0392B' } };

  if (budgetAmount > 0) {
    const remaining = budgetAmount - totalExpense - totalFixed;
    const remRow = sheet3.addRow(['月預算剩餘', Math.max(0, remaining)]);
    remRow.getCell(2).numFmt = '#,##0.00';
    remRow.getCell(2).font = { color: { argb: 'FFFF6B35' } };
  }

  // Fixed Expenses section
  sheet3.addRow([]);
  addTitle('固定支出');
  if (fixedExpenses.length === 0) {
    sheet3.addRow(['（尚未設定）']);
  } else {
    addSubHeader('名稱', '每月金額 (SGD)', '');
    for (const fe of fixedExpenses) {
      const row = sheet3.addRow([fe.name, fe.amount]);
      row.getCell(2).numFmt = '#,##0.00';
      row.getCell(2).font = { color: { argb: 'FFC0392B' } };
    }
    const totalRow = sheet3.addRow(['合計', totalFixed]);
    totalRow.eachCell(cell => { cell.font = { bold: true }; });
    totalRow.getCell(2).numFmt = '#,##0.00';
    totalRow.getCell(2).font = { bold: true, color: { argb: 'FFC0392B' } };
  }

  // Savings Goals section
  sheet3.addRow([]);
  addTitle('存錢目標');
  if (goals.length === 0) {
    sheet3.addRow(['（尚未設定）']);
  } else {
    addSubHeader('目標名稱', '目標金額 (SGD)', '目標日期');
    for (const goal of goals) {
      const row = sheet3.addRow([
        goal.name,
        goal.targetAmount,
        goal.targetDate ?? '未設定',
      ]);
      row.getCell(2).numFmt = '#,##0.00';
      row.getCell(2).font = { color: { argb: 'FF2980B9' } };
    }
  }

  // Write file
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const rangeTag = fromYM === toYM ? fromYM : `${fromYM}_${toYM}`;
  const fileName = `富男管家_${rangeTag}.xlsx`;
  saveAs(blob, fileName);
}
