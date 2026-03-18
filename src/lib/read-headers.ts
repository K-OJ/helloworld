// @ts-nocheck
import Papa from 'papaparse';

export async function readFileHeaders(file: File): Promise<string[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        preview: 1,
        complete(results) {
          resolve(results.meta.fields ?? []);
        },
        error() {
          resolve([]);
        },
      });
    });
  }

  if (ext === 'xlsx' || ext === 'xls') {
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      // sheetRows:2 → 헤더+데이터 1행. sheetRows:1이면 sheet_to_json이 빈 배열 반환
      const workbook = XLSX.read(buffer, { type: 'array', sheetRows: 2 });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      // header:1 → 2차원 배열, rows[0]이 헤더행
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (rows.length === 0) return [];
      return rows[0].map(String).filter(Boolean);
    } catch {
      return [];
    }
  }

  return [];
}
