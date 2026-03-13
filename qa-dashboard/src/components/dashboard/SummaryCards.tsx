import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SummaryCardsProps {
  total: number;
  normal: number;
  warning: number;
  danger: number;
  baselinePeriod: string;
  targetPeriod: string;
}

export function SummaryCards({ total, normal, warning, danger, baselinePeriod, targetPeriod }: SummaryCardsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>전월: <strong className="text-gray-700">{baselinePeriod}</strong></span>
        <span>→</span>
        <span>당월: <strong className="text-gray-700">{targetPeriod}</strong></span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">전체 항목</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">정상</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-700">{normal.toLocaleString()}</p>
            <p className="text-xs text-green-500 mt-1">{total > 0 ? Math.round((normal / total) * 100) : 0}%</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">경고</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-700">{warning.toLocaleString()}</p>
            <p className="text-xs text-amber-500 mt-1">{total > 0 ? Math.round((warning / total) * 100) : 0}%</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">위험</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-700">{danger.toLocaleString()}</p>
            <p className="text-xs text-red-500 mt-1">{total > 0 ? Math.round((danger / total) * 100) : 0}%</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
