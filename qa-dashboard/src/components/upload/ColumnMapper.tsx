'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { ColumnMapping } from '@/lib/types';

interface FieldDef {
  key: keyof ColumnMapping;
  label: string;
  required: boolean;
}

const FIELDS: FieldDef[] = [
  { key: 'drug_id', label: '약품 코드', required: true },
  { key: 'drug_name', label: '약품명', required: false },
  { key: 'hospital_code', label: '병원 코드', required: true },
  { key: 'prescription_volume', label: '처방량', required: true },
  { key: 'date', label: '날짜 / 기준년월', required: false },
];

interface Props {
  headers: string[];
  onConfirm: (mapping: ColumnMapping) => void;
  onBack: () => void;
}

export function ColumnMapper({ headers, onConfirm, onBack }: Props) {
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({});

  function handleChange(key: keyof ColumnMapping, value: string) {
    setMapping((prev) => ({ ...prev, [key]: value }));
  }

  const requiredFilled = FIELDS.filter((f) => f.required).every((f) => mapping[f.key]);

  function handleConfirm() {
    const result: ColumnMapping = {
      drug_id: mapping.drug_id ?? '',
      drug_name: mapping.drug_name ?? '',
      hospital_code: mapping.hospital_code ?? '',
      prescription_volume: mapping.prescription_volume ?? '',
      date: mapping.date ?? '',
    };
    onConfirm(result);
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">컬럼 매핑</h2>
        <p className="text-sm text-gray-500 mt-1">
          업로드한 파일의 컬럼이 어떤 필드에 해당하는지 선택해 주세요.
        </p>
      </div>

      <div className="space-y-3">
        {FIELDS.map((field) => (
          <div key={field.key} className="grid grid-cols-2 items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="ml-1 text-red-500">*</span>}
            </label>
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={mapping[field.key] ?? ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
            >
              <option value="">-- 선택 안 함 --</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400">* 표시 필드는 필수입니다.</p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>
          이전
        </Button>
        <Button onClick={handleConfirm} disabled={!requiredFilled}>
          검수 시작
        </Button>
      </div>
    </div>
  );
}
