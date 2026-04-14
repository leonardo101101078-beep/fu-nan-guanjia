import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { CategorySummary } from '../types';
import { formatAmount } from '../utils/format';
import './DonutChart.css';

interface Props {
  data: CategorySummary[];
  total: number;
  label: string;
  emptyLabel?: string;
}

export default function DonutChart({ data, total, label, emptyLabel }: Props) {
  const hasData = data.length > 0 && total > 0;

  const chartData = hasData
    ? data
    : [{ categoryId: 'empty', categoryName: '', icon: '', color: '#E8DDD0', total: 1, percentage: 100 }];

  return (
    <div className="donut-wrapper">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="total"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={hasData ? 2 : 0}
            stroke="none"
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="donut-center">
        <div className="donut-center-label">{label}</div>
        <div className="donut-center-amount">
          {hasData ? formatAmount(total) : (emptyLabel || '$0')}
        </div>
      </div>
    </div>
  );
}
