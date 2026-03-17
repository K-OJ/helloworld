// @ts-nocheck
'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  normal: number;
  warning: number;
  danger: number;
  total: number;
}

const SLICES = [
  { key: 'normal',  label: '정상', color: '#22c55e' },
  { key: 'warning', label: '경고', color: '#f59e0b' },
  { key: 'danger',  label: '위험', color: '#ef4444' },
] as const;

const CustomLabel = ({ cx, cy, normalPct }: { cx: number; cy: number; normalPct: number }) => (
  <>
    <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="central"
      className="fill-gray-800 dark:fill-slate-100" style={{ fontSize: 26, fontWeight: 700 }}>
      {normalPct}%
    </text>
    <text x={cx} y={cy + 16} textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 11, fill: '#94a3b8' }}>
      정상 비율
    </text>
  </>
);

export function SeverityDonutChart({ normal, warning, danger, total }: Props) {
  if (total === 0) return null;

  const counts = { normal, warning, danger };
  const data = SLICES.map(s => ({ ...s, value: counts[s.key] })).filter(d => d.value > 0);
  const normalPct = Math.round((normal / total) * 100);

  return (
    <div className="rounded-xl border bg-white p-5 dark:bg-slate-800 dark:border-slate-700">
      <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-4">심각도 분포</p>
      <div className="flex items-center gap-2">
        <ResponsiveContainer width="55%" height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={52} outerRadius={76}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={({ cx, cy }) => <CustomLabel cx={cx} cy={cy} normalPct={normalPct} />}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
              formatter={(val: number, name: string) =>
                [`${val.toLocaleString()}건 (${Math.round((val / total) * 100)}%)`, name]
              }
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="flex-1 space-y-3">
          {SLICES.map(s => (
            <div key={s.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-sm text-gray-600 dark:text-slate-400">{s.label}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-800 dark:text-slate-200">
                  {counts[s.key].toLocaleString()}
                </span>
                <span className="ml-1 text-xs text-gray-400 dark:text-slate-500">
                  ({Math.round((counts[s.key] / total) * 100)}%)
                </span>
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-gray-100 dark:border-slate-700 text-xs text-gray-400 dark:text-slate-500 text-right">
            전체 {total.toLocaleString()}건
          </div>
        </div>
      </div>
    </div>
  );
}
