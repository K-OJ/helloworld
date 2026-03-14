'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { AnomalyItem } from '@/lib/types';

interface Props {
  items: AnomalyItem[];
}

export function AnomalyBarChart({ items }: Props) {
  // 위험/경고 항목 중 절대 변동량 상위 5개
  const top5 = items
    .filter((i) => i.severity !== 'normal')
    .sort((a, b) => Math.abs(b.absolute_change) - Math.abs(a.absolute_change))
    .slice(0, 5)
    .map((i) => ({
      name: (i.drug_name || i.drug_id).slice(0, 10),
      전월: i.baseline_volume,
      당월: i.target_volume,
      change_pct: i.change_pct,
      severity: i.severity,
    }));

  if (top5.length === 0) return null;

  return (
    <div className="w-full">
      <p className="text-sm text-slate-500 mb-3">이상치 상위 5개 약품 — 전월 대비 당월 처방량</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={top5} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <Tooltip
            contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
            formatter={(value, name) => [typeof value === 'number' ? value.toLocaleString() : value, name]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="전월" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="당월" radius={[4, 4, 0, 0]}>
            {top5.map((entry, idx) => (
              <Cell
                key={idx}
                fill={entry.change_pct > 0 ? '#ef4444' : '#3b82f6'}
                fillOpacity={entry.severity === 'danger' ? 1 : 0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
