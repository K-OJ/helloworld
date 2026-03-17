// @ts-nocheck
'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import { useQAStore } from '@/store/useQAStore';
import { AI_CLASSIFICATION_LABELS } from '@/lib/constants';

const CLASS_COLORS: Record<string, string> = {
  data_error:    '#ef4444',
  market_trend:  '#3b82f6',
  seasonal:      '#22c55e',
  policy_change: '#a855f7',
  unknown:       '#94a3b8',
};

const CustomTooltip = ({ active, payload, total }: any) => {
  if (!active || !payload?.[0]) return null;
  const { name, count, cls } = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold mb-1" style={{ color: CLASS_COLORS[cls] ?? '#94a3b8' }}>{name}</p>
      <p className="text-gray-600">{count}건</p>
      <p className="text-gray-400">{Math.round((count / total) * 100)}%</p>
    </div>
  );
};

export function AiClassificationChart() {
  const aiResults = useQAStore(s => s.aiResults);

  if (!aiResults || aiResults.size === 0) return null;

  const counts: Record<string, number> = {};
  const confidenceSum: Record<string, number> = {};
  for (const r of aiResults.values()) {
    counts[r.classification] = (counts[r.classification] ?? 0) + 1;
    confidenceSum[r.classification] = (confidenceSum[r.classification] ?? 0) + r.confidence;
  }

  const total = Object.values(counts).reduce((s, v) => s + v, 0);

  const barData = Object.entries(counts)
    .map(([cls, count]) => ({
      name: AI_CLASSIFICATION_LABELS[cls] ?? cls,
      count,
      cls,
      avgConf: Math.round((confidenceSum[cls] / count) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // 레이더 차트용: 모든 5개 분류 포함 (없으면 0)
  const ALL_CLASSES = ['data_error', 'market_trend', 'seasonal', 'policy_change', 'unknown'] as const;
  const radarData = ALL_CLASSES.map(cls => ({
    cls,
    subject: AI_CLASSIFICATION_LABELS[cls],
    value: counts[cls] ?? 0,
  }));

  return (
    <div className="rounded-xl border bg-white p-5 dark:bg-slate-800 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">AI 원인 분류 결과</p>
        <span className="text-xs text-gray-400 dark:text-slate-500">총 {total}건 분석</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 막대 차트 */}
        <div>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">분류별 건수</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip total={total} />} />
              <Bar dataKey="count" name="건수" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={CLASS_COLORS[entry.cls] ?? '#94a3b8'} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 레이더 차트 */}
        <div>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">분류 분포 레이더</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData} margin={{ top: 4, right: 24, left: 24, bottom: 4 }}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 10, fill: '#64748b' }}
              />
              <Radar
                name="건수"
                dataKey="value"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
                formatter={(v: number) => [`${v}건`, '건수']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 평균 신뢰도 + 범례 */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">분류별 평균 신뢰도</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {barData.map(entry => (
            <div key={entry.cls} className="rounded-lg p-2 text-center"
              style={{ backgroundColor: CLASS_COLORS[entry.cls] + '18' }}>
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CLASS_COLORS[entry.cls] }} />
                <span className="text-xs text-gray-600 dark:text-slate-400 truncate">{entry.name}</span>
              </div>
              <p className="text-sm font-bold" style={{ color: CLASS_COLORS[entry.cls] }}>
                {entry.avgConf}%
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500">{entry.count}건</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
