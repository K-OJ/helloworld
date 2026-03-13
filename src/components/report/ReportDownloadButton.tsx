'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { QaReport, AiAnalysisResult, AnomalyItem } from '@/lib/types';

interface ReportDownloadButtonProps {
  uploadResult: { summary: { total: number; normal: number; warning: number; danger: number }; items: AnomalyItem[]; baseline_period: string; target_period: string } | null;
  aiResults: Map<string, AiAnalysisResult>;
}

export function ReportDownloadButton({ uploadResult, aiResults }: ReportDownloadButtonProps) {
  const [loading, setLoading] = useState<'csv' | 'xlsx' | null>(null);

  if (!uploadResult) return null;

  async function download(format: 'csv' | 'xlsx') {
    if (!uploadResult) return;
    setLoading(format);

    try {
      const report: QaReport = {
        generated_at: new Date().toISOString(),
        baseline_period: uploadResult.baseline_period,
        target_period: uploadResult.target_period,
        total_items: uploadResult.summary.total,
        normal_count: uploadResult.summary.normal,
        warning_count: uploadResult.summary.warning,
        danger_count: uploadResult.summary.danger,
        items: uploadResult.items.map((item) => ({
          ...item,
          ai_analysis: aiResults.get(`${item.drug_id}__${item.hospital_code}`) ?? aiResults.get(item.drug_id),
        })),
      };

      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report, format }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? '다운로드 실패');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auto-qa-report.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={() => download('csv')}
        disabled={loading !== null}
        className="gap-2"
      >
        {loading === 'csv' ? '생성 중...' : '📥 CSV 다운로드'}
      </Button>
      <Button
        onClick={() => download('xlsx')}
        disabled={loading !== null}
        className="gap-2"
      >
        {loading === 'xlsx' ? '생성 중...' : '📊 Excel 다운로드'}
      </Button>
    </div>
  );
}
