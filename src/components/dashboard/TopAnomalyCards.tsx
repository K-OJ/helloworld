// @ts-nocheck
'use client';

import type { AnomalyItem } from '@/lib/types';

interface Props {
  items: AnomalyItem[];
}

const RANK_COLORS = [
  'bg-red-500 text-white',
  'bg-orange-500 text-white',
  'bg-amber-500 text-white',
  'bg-amber-400 text-white',
  'bg-yellow-400 text-gray-800',
];

const SEVERITY_STYLE = {
  danger:  { border: 'border-red-200 dark:border-red-800',  bg: 'bg-red-50 dark:bg-red-900/10',   badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',  dot: 'bg-red-500',  label: '위험' },
  warning: { border: 'border-amber-200 dark:border-amber-800', bg: 'bg-amber-50 dark:bg-amber-900/10', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', dot: 'bg-amber-400', label: '경고' },
  normal:  { border: 'border-slate-200 dark:border-slate-700', bg: 'bg-white dark:bg-slate-800', badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', dot: 'bg-green-400', label: '정상' },
};

export function TopAnomalyCards({ items }: Props) {
  const topItems = [...items]
    .filter((i) => i.severity !== 'normal')
    .sort((a, b) => {
      if (a.severity === 'danger' && b.severity !== 'danger') return -1;
      if (b.severity === 'danger' && a.severity !== 'danger') return 1;
      return Math.abs(b.change_pct) - Math.abs(a.change_pct);
    })
    .slice(0, 5);

  if (topItems.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">주요 이상 항목 TOP 5</p>
        <span className="text-xs text-gray-400 dark:text-slate-500">변동률 기준 정렬</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
        {topItems.map((item, idx) => {
          const style = SEVERITY_STYLE[item.severity] ?? SEVERITY_STYLE.normal;
          const rankColor = RANK_COLORS[idx] ?? 'bg-slate-400 text-white';
          const isPositive = item.change_pct > 0;
          return (
            <div
              key={`${item.drug_id}__${item.hospital_code}`}
              className={`flex-shrink-0 w-48 rounded-xl border ${style.border} ${style.bg} p-4 space-y-2.5`}
            >
              {/* 순위 뱃지 + 심각도 */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-black ${rankColor}`}>
                  {idx + 1}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.badge}`}>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${style.dot} mr-1`} />
                  {style.label}
                </span>
              </div>

              {/* 약품명 */}
              <div>
                <p className="text-sm font-bold text-gray-800 dark:text-slate-100 leading-tight line-clamp-2">
                  {item.drug_name || item.drug_id}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate">{item.drug_id}</p>
              </div>

              {/* 병원 코드 */}
              <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                병원: {item.hospital_code}
              </p>

              {/* 변동률 */}
              <div className={`text-lg font-black ${isPositive ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                {isPositive ? '+' : ''}{item.change_pct.toFixed(1)}%
              </div>

              {/* 처방량 변화 */}
              <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-slate-500">
                <span>{item.baseline_volume.toLocaleString()}</span>
                <span className="text-gray-300 dark:text-slate-600">→</span>
                <span className="font-medium text-gray-600 dark:text-slate-300">{item.target_volume.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
