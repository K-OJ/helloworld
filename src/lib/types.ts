export interface PrescriptionRecord {
  drug_id: string;
  drug_name: string;
  hospital_code: string;
  prescription_volume: number;
  date: string;
}

export interface DrugSummary {
  drug_id: string;
  drug_name: string;
  hospital_code: string;
  baseline_volume: number;
  target_volume: number;
  change_pct: number;
  absolute_change: number;
}

export type Severity = 'normal' | 'warning' | 'danger';

export interface AnomalyItem extends DrugSummary {
  severity: Severity;
  rule_triggered: string;
}

export type AiClassification =
  | 'data_error'
  | 'market_trend'
  | 'seasonal'
  | 'policy_change'
  | 'unknown';

export interface AiAnalysisResult {
  drug_id: string;
  drug_name: string;
  classification: AiClassification;
  confidence: number;
  explanation: string;
  recommended_action: string;
}

export interface QaReport {
  generated_at: string;
  baseline_period: string;
  target_period: string;
  total_items: number;
  normal_count: number;
  warning_count: number;
  danger_count: number;
  items: (AnomalyItem & { ai_analysis?: AiAnalysisResult })[];
}

export interface ColumnMapping {
  drug_id: string;
  drug_name: string;
  hospital_code: string;
  prescription_volume: string;
  date: string;
}

export interface ParseResult {
  records: PrescriptionRecord[];
  skipped_rows: number;
  errors: string[];
}

export interface UploadResult {
  summary: {
    total: number;
    normal: number;
    warning: number;
    danger: number;
  };
  items: AnomalyItem[];
  baseline_period: string;
  target_period: string;
  skipped_rows: { baseline: number; target: number };
}
