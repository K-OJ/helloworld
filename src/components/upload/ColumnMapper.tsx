'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { ColumnMapping } from '@/lib/types';
import { suggestMapping } from '@/lib/suggest-mapping';

interface FieldDef {
  key: keyof ColumnMapping;
  label: string;
  required: boolean;
}

const FIELDS: FieldDef[] = [
  { key: 'drug_id', label: '약품 코드', required: false },
  { key: 'drug_name', label: '약품명', required: false },
  { key: 'hospital_code', label: '병원 코드', required: false },
  { key: 'prescription_volume', label: '처방량', required: true },
  { key: 'date', label: '날짜 / 기준년월', required: false },
];

const REQUIRED_FIELDS = FIELDS.filter((f) => f.required).map((f) => f.key);

interface Props {
  headers: string[];
  onConfirm: (mapping: ColumnMapping) => void;
  onBack: () => void;
}

export function ColumnMapper({ headers, onConfirm, onBack }: Props) {
  const suggested = useMemo(() => suggestMapping(headers), [headers]);
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>(suggested);
  // Track which fields were auto-suggested (not yet manually changed)
  const [autoFields, setAutoFields] = useState<Set<keyof ColumnMapping>>(
    () => new Set(Object.keys(suggested) as (keyof ColumnMapping)[])
  );
  const autoConfirmedRef = useRef(false);

  const requiredFilled = REQUIRED_FIELDS.every((k) => mapping[k]);
  const allRequiredAutoMatched = REQUIRED_FIELDS.every((k) => suggested[k]);

  // Auto-proceed only once when all required fields are auto-matched
  useEffect(() => {
    if (allRequiredAutoMatched && !autoConfirmedRef.current) {
      autoConfirmedRef.current = true;
      const timer = setTimeout(() => {
        onConfirm({
          drug_id: suggested.drug_id ?? '',
          drug_name: suggested.drug_name ?? '',
          hospital_code: suggested.hospital_code ?? '',
          prescription_volume: suggested.prescription_volume ?? '',
          date: suggested.date ?? '',
        });
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [allRequiredAutoMatched, suggested, onConfirm]);

  function handleChange(key: keyof ColumnMapping, value: string) {
    setMapping((prev) => ({ ...prev, [key]: value }));
    setAutoFields((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  function handleConfirm() {
    onConfirm({
      drug_id: mapping.drug_id ?? '',
      drug_name: mapping.drug_name ?? '',
      hospital_code: mapping.hospital_code ?? '',
      prescription_volume: mapping.prescription_volume ?? '',
      date: mapping.date ?? '',
    });
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">컬럼 매핑</h2>
        <p className="text-sm text-gray-500 mt-1">
          업로드한 파일의 컬럼이 어떤 필드에 해당하는지 선택해 주세요.
        </p>
      </div>

      {/* Status banner */}
      {allRequiredAutoMatched ? (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          <span className="text-green-500">✓</span>
          <span>파일 컬럼을 자동으로 인식했습니다. 잠시 후 자동으로 진행됩니다.</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <span>⚠</span>
          <span>일부 필수 컬럼을 인식하지 못했습니다. 직접 선택해 주세요.</span>
        </div>
      )}

      <div className="space-y-3">
        {FIELDS.map((field) => {
          const isAuto = autoFields.has(field.key) && !!suggested[field.key];
          return (
            <div key={field.key} className="grid grid-cols-2 items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="ml-1 text-red-500">*</span>}
              </label>
              <div className="relative flex items-center gap-2">
                <select
                  className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isAuto ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-white'
                  }`}
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
                {isAuto && (
                  <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    자동
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400">
        * 처방량은 필수입니다. 약품 코드·병원 코드를 선택하지 않으면 해당 컬럼을 제외하고 비교합니다.
      </p>

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
