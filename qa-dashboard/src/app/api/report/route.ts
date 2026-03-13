import { NextRequest, NextResponse } from 'next/server';
import { generateCsvReport, generateExcelReport } from '@/lib/report-generator';
import type { QaReport } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const report: QaReport = body.report;
    const format: 'csv' | 'xlsx' = body.format ?? 'csv';

    if (!report) {
      return NextResponse.json({ error: '리포트 데이터가 없습니다.' }, { status: 400 });
    }

    const filename = `auto-qa-report_${report.target_period.replace(/[^a-zA-Z0-9가-힣]/g, '-')}`;

    if (format === 'xlsx') {
      const buffer = generateExcelReport(report);
      return new NextResponse(buffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}.xlsx`,
        },
      });
    }

    const csv = generateCsvReport(report);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}.csv`,
      },
    });
  } catch (err) {
    console.error('[report] error:', err);
    return NextResponse.json(
      { error: `리포트 생성 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` },
      { status: 500 }
    );
  }
}
