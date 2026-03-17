// @ts-nocheck
'use client';

import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import type { AnomalyItem } from '@/lib/types';

interface Props {
  items: AnomalyItem[];
}

const COLORS = {
  warning: '#f59e0b',
  danger:  '#ef4444',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg max-w-52">
      <p className="font-semibold text-gray-700 truncate mb-1">{d.name}</p>
      <p className="text-gray-500">전월 처방량: <span className="font-medium text-gray-700">{d.x.toLocaleString()}</span></p>
      <p className="text-gray-500">당월 처방량: <span className="font-medium text-gray-700">{d.targetVol.toLocaleString()}</span></p>
      <p className="text-gray-500">변동률: <span className={`font-bold ${d.y > 0 ? 'text-red-600' : 'text-blue-600'}`}>
        {d.y > 0 ? '+' : ''}{d.y.toFixed(1)}%
      </span></p>
      <p className="text-gray-500">심각도: <span className="font-medium" style={{ color: COLORS[d.severity] ?? '#94a3b8' }}>
        {d.severity === 'danger' ? '위험' : '경고'}
      </span></p>
    </div>
  );
};

export function VolumeScatterChart({ items }: Props) {
  const data = items
    .filter(i => i.severity !== 'normal')
    .map(i => ({
      x: i.baseline_volume,
      y: Math.round(i.change_pct * 10) / 10,
      z: Math.min(Math.abs(i.absolute_change) + 50, 800),
      name: i.drug_name || i.drug_id,
      severity: i.severity,
      targetVol: i.target_volume,
    }));

  if (data.length === 0) return null;

  return (
    <div className="rounded-xl border bg-white p-5 dark:bg-slate-800 dark:border-slate-700">
      <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
        처방량 규모 vs 변동률 분포
      </p>
      <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
        X: 전월 처방량 &nbsp;·&nbsp; Y: 변동률(%) &nbsp;·&nbsp; 버블 크기: 절대 변화량
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 8, right: 32, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            type="number" dataKey="x" name="전월 처방량"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
            label={{ value: '전월 처방량', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#94a3b8' }}
          />
          <YAxis
            type="number" dataKey="y" name="변동률"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={v => `${v}%`}
            label={{ value: '변동률(%)', angle: -90, position: 'insideLeft', offset: 8, fontSize: 10, fill: '#94a3b8' }}
          />
          <ZAxis type="number" dataKey="z" range={[40, 400]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

          {/* 기준선 */}
          <ReferenceLine y={0}   stroke="#94a3b8" strokeDasharray="4 4" />
          <ReferenceLine y={50}  stroke="#ef444450" strokeDasharray="3 3"
            label={{ value: '+50%', fill: '#ef4444', fontSize: 9, position: 'right' }} />
          <ReferenceLine y={-50} stroke="#ef444450" strokeDasharray="3 3"
            label={{ value: '-50%', fill: '#ef4444', fontSize: 9, position: 'right' }} />
          <ReferenceLine y={30}  stroke="#f59e0b50" strokeDasharray="3 3"
            label={{ value: '+30%', fill: '#f59e0b', fontSize: 9, position: 'right' }} />
          <ReferenceLine y={-30} stroke="#f59e0b50" strokeDasharray="3 3"
            label={{ value: '-30%', fill: '#f59e0b', fontSize: 9, position: 'right' }} />

          <Scatter data={data} name="약품">
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={COLORS[entry.severity] ?? '#94a3b8'}
                fillOpacity={0.7}
                stroke={COLORS[entry.severity] ?? '#94a3b8'}
                strokeOpacity={0.4}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-5 mt-2 justify-center text-xs text-gray-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-amber-400 opacity-80" />경고
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-400 opacity-80" />위험
        </span>
        <span className="text-gray-300 dark:text-slate-600">·</span>
        <span className="text-gray-400 dark:text-slate-500">버블이 클수록 절대 변화량 큼</span>
      </div>
    </div>
  );
}
