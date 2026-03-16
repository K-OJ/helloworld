// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  const normalPct = total > 0 ? Math.round((normal / total) * 100) : 0;
  const warningPct = total > 0 ? Math.round((warning / total) * 100) : 0;
  const dangerPct = total > 0 ? Math.round((danger / total) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-500" aria-label={`${prevLabel} ${baselinePeriod} → ${currLabel} ${targetPeriod}`}>
        <span>{prevLabel}: <strong className="text-gray-700">{baselinePeriod}</strong></span>
        <span aria-hidden="true">→</span>
        <span>{currLabel}: <strong className="text-gray-700">{targetPeriod}</strong></span>
      </div>
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        role="region"
        aria-label="검수 결과 요약 지표"
      >
        <Card aria-label={`${totalLabel} ${total.toLocaleString()}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{totalLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900" aria-live="polite">{total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50" aria-label={`${normalLabel} ${normal.toLocaleString()}, ${normalPct}%`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">{normalLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-700" aria-live="polite">{normal.toLocaleString()}</p>
            <p className="text-xs text-green-500 mt-1" aria-hidden="true">{normalPct}%</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50" aria-label={`${warningLabel} ${warning.toLocaleString()}, ${warningPct}%`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">{warningLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-700" aria-live="polite">{warning.toLocaleString()}</p>
            <p className="text-xs text-amber-500 mt-1" aria-hidden="true">{warningPct}%</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50" aria-label={`${dangerLabel} ${danger.toLocaleString()}, ${dangerPct}%`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">{dangerLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-700" aria-live="polite">{danger.toLocaleString()}</p>
            <p className="text-xs text-red-500 mt-1" aria-hidden="true">{dangerPct}%</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
