// @ts-nocheck
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { ParseResult, PrescriptionRecord, ColumnMapping } from './types';
import { MAX_FILE_SIZE_BYTES, REQUIRED_COLUMNS, getErrorMessage } from './constants';

function normalizeRow(row: Record<string, unknown>, mapping?: ColumnMapping): PrescriptionRecord | null {
  // Normalize column names (trim, lowercase)
  const normalized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    normalized[k.trim().toLowerCase()] = v;
  }

  let drug_id: string;
  let drug_name: string;
  let hospital_code: string;
  let raw_volume: unknown;
  let date: string;

  if (mapping) {
    drug_id = String(normalized[mapping.drug_id.trim().toLowerCase()] ?? '').trim();
    drug_name = String(normalized[mapping.drug_name.trim().toLowerCase()] ?? '').trim();
    hospital_code = String(normalized[mapping.hospital_code.trim().toLowerCase()] ?? '').trim();
    raw_volume = normalized[mapping.prescription_volume.trim().toLowerCase()];
    date = String(normalized[mapping.date.trim().toLowerCase()] ?? '').trim();
  } else {
    drug_id = String(normalized['drug_id'] ?? '').trim();
    drug_name = String(normalized['drug_name'] ?? '').trim();
    hospital_code = String(normalized['hospital_code'] ?? '').trim();
    raw_volume = normalized['prescription_volume'];
    date = String(normalized['date'] ?? '').trim();
  }

  // drug_id, hospital_code는 선택 필드 — 빈 값 허용

  const prescription_volume = Number(raw_volume);
  if (isNaN(prescription_volume)) return null;

  return { drug_id, drug_name, hospital_code, prescription_volume, date };
}

function validateColumns(headers: string[]): string | null {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  const missing = REQUIRED_COLUMNS.filter((col) => !normalized.includes(col));
  if (missing.length > 0) {
    return `필수 컬럼이 없습니다: ${missing.join(', ')}`;
  }
  return null;
}


export async function parseCSV(file: File, mapping?: ColumnMapping): Promise<ParseResult> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { records: [], skipped_rows: 0, errors: [getErrorMessage('fileTooLarge')] };
  }

  const text = await file.text();

  return new Promise((resolve) => {
    const records: PrescriptionRecord[] = [];
    let skipped_rows = 0;
    let headerValidated = false;

    Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
      chunk(results: Papa.ParseResult<Record<string, unknown>>) {
        if (!headerValidated && results.meta.fields) {
          if (!mapping) {
            const err = validateColumns(results.meta.fields);
            if (err) {
              resolve({ records: [], skipped_rows: 0, errors: [err] });
              return;
            }
          }
          headerValidated = true;
        }
        for (const row of results.data) {
          const record = normalizeRow(row, mapping);
          if (record) {
            records.push(record);
          } else {
            skipped_rows++;
          }
        }
      },
      complete() {
        resolve({ records, skipped_rows, errors: [] });
      },
      error(err: Error) {
        resolve({ records: [], skipped_rows: 0, errors: [err.message] });
      },
    });
  });
}

export async function parseExcel(file: File, mapping?: ColumnMapping): Promise<ParseResult> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { records: [], skipped_rows: 0, errors: [getErrorMessage('fileTooLarge')] };
  }

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', sheetRows: 100000 });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

    if (rows.length === 0) {
      return { records: [], skipped_rows: 0, errors: ['파일이 비어 있습니다.'] };
    }

    if (!mapping) {
      const headers = Object.keys(rows[0]);
      const colError = validateColumns(headers);
      if (colError) {
        return { records: [], skipped_rows: 0, errors: [colError] };
      }
    }

    const records: PrescriptionRecord[] = [];
    let skipped_rows = 0;

    for (const row of rows) {
      const record = normalizeRow(row, mapping);
      if (record) {
        records.push(record);
      } else {
        skipped_rows++;
      }
    }

    return { records, skipped_rows, errors: [] };
  } catch (err) {
    return { records: [], skipped_rows: 0, errors: [`파일 파싱 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`] };
  }
}

export async function parseFile(file: File, mapping?: ColumnMapping): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'csv') return parseCSV(file, mapping);
  if (ext === 'xlsx' || ext === 'xls') return parseExcel(file, mapping);
  return { records: [], skipped_rows: 0, errors: [getErrorMessage('invalidFormat')] };
}
