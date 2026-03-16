// @ts-nocheck
import type { AnomalyItem } from '@/lib/types';
import { SEVERITY_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ChangeChartProps {
  items: AnomalyItem[];
}

export function ChangeChart({ items }: ChangeChartProps) {
  const top20 = items.slice(0, 20);
  const maxAbs = Math.max(...top20.map((i) => Math.abs(i.change_pct)), 1);

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500">처방량 변동률 상위 20개 항목</p>
      <div className="space-y-1.5">
        {top20.map((item, idx) => {
          const barWidth = (Math.abs(item.change_pct) / maxAbs) * 100;
          const isPositive = item.change_pct >= 0;
          return (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <div className="w-28 shrink-0 truncate text-right text-gray-600" title={item.drug_name}>
                {item.drug_name || item.drug_id}
              </div>
              <div className="flex flex-1 items-center gap-1">
                <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', {
                      'bg-green-400': item.severity === 'normal',
                      'bg-amber-400': item.severity === 'warning',
                      'bg-red-400': item.severity === 'danger',
                    })}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className={cn('w-16 text-right font-medium shrink-0', SEVERITY_COLORS[item.severity].split(' ')[1])}>
                  {isPositive ? '+' : ''}{item.change_pct.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
