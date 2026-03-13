import { NextRequest, NextResponse } from 'next/server';
import { parseFile } from '@/lib/parser';
import { runRuleEngine, extractPeriod } from '@/lib/rule-engine';
import type { UploadResult } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const baselineFile = formData.get('baseline') as File | null;
    const targetFile = formData.get('target') as File | null;

    if (!baselineFile || !targetFile) {
      return NextResponse.json(
        { error: '전월(baseline)과 당월(target) 파일을 모두 업로드해 주세요.' },
        { status: 400 }
      );
    }

    const [baselineResult, targetResult] = await Promise.all([
      parseFile(baselineFile),
      parseFile(targetFile),
    ]);

    if (baselineResult.errors.length > 0) {
      return NextResponse.json(
        { error: `전월 파일 오류: ${baselineResult.errors.join(', ')}` },
        { status: 400 }
      );
    }
    if (targetResult.errors.length > 0) {
      return NextResponse.json(
        { error: `당월 파일 오류: ${targetResult.errors.join(', ')}` },
        { status: 400 }
      );
    }

    const items = runRuleEngine(baselineResult.records, targetResult.records);

    const summary = {
      total: items.length,
      normal: items.filter((i) => i.severity === 'normal').length,
      warning: items.filter((i) => i.severity === 'warning').length,
      danger: items.filter((i) => i.severity === 'danger').length,
    };

    const result: UploadResult = {
      summary,
      items,
      baseline_period: extractPeriod(baselineResult.records),
      target_period: extractPeriod(targetResult.records),
      skipped_rows: {
        baseline: baselineResult.skipped_rows,
        target: targetResult.skipped_rows,
      },
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[upload] error:', err);
    return NextResponse.json(
      { error: `서버 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}` },
      { status: 500 }
    );
  }
}
