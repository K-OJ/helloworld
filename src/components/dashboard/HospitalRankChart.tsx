// @ts-nocheck
'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import type { AnomalyItem } from '@/lib/types';

interface Props {
  items: AnomalyItem[];
}

export function HospitalRankChart({ items }: Props) {
  const map = new Map<string, { warning: number; danger: number }>();

  for (const item of items) {
    if (item.severity === 'normal') continue;
    const cur = map.get(item.hospital_code) ?? { warning: 0, danger: 0 };
    if (item.severity === 'danger') cur.danger++;
    else cur.warning++;
    map.set(item.hospital_code, cur);
  }

  const data = Array.from(map.entries())
    .map(([code, c]) => ({
      code: code.length > 9 ? code.slice(0, 9) + '…' : code,
      경고: c.warning,
      위험: c.danger,
      total: c.warning + c.danger,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  if (data.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const total = payload.reduce((s: number, p: any) => s + p.value, 0);
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.fill }}>
            {p.name}: {p.value}건
          </p>
        ))}
        <p className="mt-1 text-gray-500 border-t pt-1">합계: {total}건</p>
      </div>
    );
  };

  return (
    <div className="rounded-xl border bg-white p-5 dark:bg-slate-800 dark:border-slate-700">
      <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-4">
        병원별 이상 건수 TOP {data.length}
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 32, left: 4, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
          />
          <YAxis
            type="category"
            dataKey="code"
            tick={{ fontSize: 11, fill: '#64748b' }}
            width={76}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="위험" stackId="a" fill="#ef4444" fillOpacity={0.85} />
          <Bar dataKey="경고" stackId="a" fill="#f59e0b" fillOpacity={0.85} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
