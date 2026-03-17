// @ts-nocheck

interface SummaryCardsProps {
  total: number;
  normal: number;
  warning: number;
  danger: number;
  baselinePeriod: string;
  targetPeriod: string;
  prevLabel?: string;
  currLabel?: string;
  totalLabel?: string;
  normalLabel?: string;
  warningLabel?: string;
  dangerLabel?: string;
}

export function SummaryCards({
  total, normal, warning, danger, baselinePeriod, targetPeriod,
  prevLabel = '전월', currLabel = '당월',
  totalLabel = '전체 항목', normalLabel = '정상', warningLabel = '경고', dangerLabel = '위험',
}: SummaryCardsProps) {
  const normalPct  = total > 0 ? Math.round((normal  / total) * 100) : 0;
  const warningPct = total > 0 ? Math.round((warning / total) * 100) : 0;
  const dangerPct  = total > 0 ? Math.round((danger  / total) * 100) : 0;

  const healthScore = total > 0
    ? Math.max(0, Math.round(normalPct - dangerPct * 0.5))
    : 0;

  const healthColor =
    healthScore >= 80 ? '#16a34a' :
    healthScore >= 50 ? '#d97706' :
                        '#dc2626';

  const healthLabel =
    healthScore >= 80 ? '양호' :
    healthScore >= 50 ? '주의' : '위험';

  const healthBg =
    healthScore >= 80 ? 'from-green-50 to-emerald-50 border-green-200 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-800' :
    healthScore >= 50 ? 'from-amber-50 to-yellow-50 border-amber-200 dark:from-amber-900/20 dark:to-yellow-900/20 dark:border-amber-800' :
                        'from-red-50 to-rose-50 border-red-200 dark:from-red-900/20 dark:to-rose-900/20 dark:border-red-800';

  const healthTextColor =
    healthScore >= 80 ? 'text-green-600 dark:text-green-400' :
    healthScore >= 50 ? 'text-amber-600 dark:text-amber-400' :
                        'text-red-600 dark:text-red-400';

  // SVG 게이지 파라미터
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - healthScore / 100);

  const stats = [
    { label: totalLabel,   value: total,   pct: 100,        color: '#94a3b8', bar: 'bg-slate-400 dark:bg-slate-500',  text: 'text-gray-800 dark:text-slate-100' },
    { label: normalLabel,  value: normal,  pct: normalPct,  color: '#22c55e', bar: 'bg-green-500',                    text: 'text-green-600 dark:text-green-400' },
    { label: warningLabel, value: warning, pct: warningPct, color: '#f59e0b', bar: 'bg-amber-400',                    text: 'text-amber-600 dark:text-amber-400' },
    { label: dangerLabel,  value: danger,  pct: dangerPct,  color: '#ef4444', bar: 'bg-red-500',                      text: 'text-red-600 dark:text-red-400' },
  ];

  return (
    <div className="space-y-4">
      {/* 기간 배지 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          {prevLabel}: <strong>{baselinePeriod}</strong>
        </span>
        <span className="text-slate-300 dark:text-slate-600 text-sm">→</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          {currLabel}: <strong>{targetPeriod}</strong>
        </span>
      </div>

      {/* 메인 그리드: 건강점수 | 통계 카드 | 분포 바 */}
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 items-stretch">

        {/* ── 건강 점수 게이지 ── */}
        <div className={`rounded-2xl border bg-gradient-to-br ${healthBg} p-5 flex flex-col items-center justify-center gap-2 min-w-[148px]`}>
          <p className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest">건강 점수</p>
          <div className="relative w-[88px] h-[88px]">
            <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
              <circle cx="44" cy="44" r={r} fill="none" stroke="#e2e8f0" strokeWidth="7"
                className="dark:stroke-slate-700" />
              <circle cx="44" cy="44" r={r} fill="none" strokeWidth="7"
                stroke={healthColor}
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.9s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black leading-none" style={{ color: healthColor }}>{healthScore}</span>
              <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500">/ 100</span>
            </div>
          </div>
          <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${healthTextColor}`}
            style={{ backgroundColor: healthColor + '18' }}>
            {healthLabel}
          </span>
        </div>

        {/* ── 4개 통계 카드 ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label}
              className="rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 flex flex-col justify-between gap-3">
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400">{s.label}</p>
              <p className={`text-3xl font-black leading-none ${s.text}`}>{s.value.toLocaleString()}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-400 dark:text-slate-500">
                  <span>비율</span>
                  <span className="font-bold">{s.pct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div className={`h-full rounded-full ${s.bar} transition-all duration-700`}
                    style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── 분포 시각화 ── */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 flex flex-col justify-center gap-4 min-w-[200px]">
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">심각도 분포</p>

          {/* 쌓인 바 */}
          <div className="h-4 w-full rounded-full overflow-hidden flex">
            {normalPct  > 0 && <div className="bg-green-500 h-full transition-all duration-700" style={{ width: `${normalPct}%` }} />}
            {warningPct > 0 && <div className="bg-amber-400 h-full transition-all duration-700" style={{ width: `${warningPct}%` }} />}
            {dangerPct  > 0 && <div className="bg-red-500  h-full transition-all duration-700" style={{ width: `${dangerPct}%` }} />}
            {total === 0     && <div className="bg-slate-200 dark:bg-slate-700 h-full w-full" />}
          </div>

          {/* 범례 */}
          <div className="space-y-2">
            {[
              { label: normalLabel,  value: normal,  pct: normalPct,  dot: 'bg-green-500',  text: 'text-green-600 dark:text-green-400' },
              { label: warningLabel, value: warning, pct: warningPct, dot: 'bg-amber-400',  text: 'text-amber-600 dark:text-amber-400' },
              { label: dangerLabel,  value: danger,  pct: dangerPct,  dot: 'bg-red-500',    text: 'text-red-600 dark:text-red-400' },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${row.dot}`} />
                <span className="text-xs text-gray-600 dark:text-slate-400 flex-1">{row.label}</span>
                <span className={`text-sm font-bold ${row.text}`}>{row.value.toLocaleString()}</span>
                <span className="text-xs text-gray-400 dark:text-slate-500 w-10 text-right">({row.pct}%)</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-gray-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-700 pt-2 text-right">
            전체 {total.toLocaleString()}건
          </p>
        </div>

      </div>
    </div>
  );
}
