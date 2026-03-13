import Papa from 'papaparse';

export async function readFileHeaders(file: File): Promise<string[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    return new Promise((resolve) => {
      Papa.parse<Record<string, unknown>>(file, {
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
      const workbook = XLSX.read(buffer, { type: 'array', sheetRows: 1 });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
      if (rows.length === 0) return [];
      return Object.keys(rows[0]);
    } catch {
      return [];
    }
  }

  return [];
}
