import * as XLSX from 'xlsx';
import type { QaReport } from './types';
import { SEVERITY_LABELS, AI_CLASSIFICATION_LABELS } from './constants';

export function generateCsvReport(report: QaReport): string {
  const headers = [
    '약품코드', '약품명', '병원코드',
    '전월 처방량', '당월 처방량', '변동률(%)', '절대변동량',
    '심각도', '룰 트리거', 'AI 분류', 'AI 신뢰도', 'AI 설명', '권장 조치',
  ];

  const rows = report.items.map((item) => [
    item.drug_id,
    item.drug_name,
    item.hospital_code,
    item.baseline_volume,
    item.target_volume,
    item.change_pct.toFixed(2),
    item.absolute_change,
    SEVERITY_LABELS[item.severity],
    item.rule_triggered,
    item.ai_analysis ? AI_CLASSIFICATION_LABELS[item.ai_analysis.classification] ?? item.ai_analysis.classification : '',
    item.ai_analysis ? (item.ai_analysis.confidence * 100).toFixed(0) + '%' : '',
    item.ai_analysis?.explanation ?? '',
    item.ai_analysis?.recommended_action ?? '',
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
    )
    .join('\n');

  return '\uFEFF' + csv; // BOM for Excel Korean encoding
}

export function generateExcelReport(report: QaReport): Buffer {
  const headers = [
    '약품코드', '약품명', '병원코드',
    '전월 처방량', '당월 처방량', '변동률(%)', '절대변동량',
    '심각도', '룰 트리거', 'AI 분류', 'AI 신뢰도', 'AI 설명', '권장 조치',
  ];

  const data = [
    headers,
    ...report.items.map((item) => [
      item.drug_id,
      item.drug_name,
      item.hospital_code,
      item.baseline_volume,
      item.target_volume,
      parseFloat(item.change_pct.toFixed(2)),
      item.absolute_change,
      SEVERITY_LABELS[item.severity],
      item.rule_triggered,
      item.ai_analysis ? AI_CLASSIFICATION_LABELS[item.ai_analysis.classification] ?? item.ai_analysis.classification : '',
      item.ai_analysis ? parseFloat((item.ai_analysis.confidence * 100).toFixed(0)) : '',
      item.ai_analysis?.explanation ?? '',
      item.ai_analysis?.recommended_action ?? '',
    ]),
  ];

  // Summary sheet
  const summaryData = [
    ['생성일시', report.generated_at],
    ['전월 기준', report.baseline_period],
    ['당월 기준', report.target_period],
    ['전체 항목 수', report.total_items],
    ['정상', report.normal_count],
    ['경고', report.warning_count],
    ['위험', report.danger_count],
  ];

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  const wsDetail = XLSX.utils.aoa_to_sheet(data);

  // Set column widths for detail sheet
  wsDetail['!cols'] = [
    { wch: 12 }, { wch: 20 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 12 },
    { wch: 8 }, { wch: 28 }, { wch: 14 }, { wch: 10 }, { wch: 40 }, { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, '요약');
  XLSX.utils.book_append_sheet(wb, wsDetail, '상세 검수 결과');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
