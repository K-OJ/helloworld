'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { UploadCloud, FileCheck2, AlertCircle, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PharmaData } from '@/utils/compareData';

interface DataUploaderProps {
  onSubmit: (prevData: PharmaData[], currData: PharmaData[]) => void;
}

interface UploadState {
  file: File | null;
  data: PharmaData[] | null;
  error: string | null;
}

const REQUIRED_COLUMNS: (keyof PharmaData)[] = [
  'drug_id',
  'drug_name',
  'hospital_code',
  'prescription_volume',
  'date',
];

function parseCSV(file: File): Promise<PharmaData[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields ?? [];
        const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());
        const missing = REQUIRED_COLUMNS.filter(
          (col) => !normalizedHeaders.includes(col)
        );
        if (missing.length > 0) {
          reject(new Error(`필수 컬럼 없음: ${missing.join(', ')}`));
          return;
        }
        const rows: PharmaData[] = results.data
          .map((row) => {
            const normalized: Record<string, string> = {};
            for (const [k, v] of Object.entries(row)) {
              normalized[k.trim().toLowerCase()] = String(v).trim();
            }
            return {
              drug_id: normalized['drug_id'],
              drug_name: normalized['drug_name'],
              hospital_code: normalized['hospital_code'],
              prescription_volume: Number(normalized['prescription_volume']),
              date: normalized['date'],
            };
          })
          .filter((r) => r.drug_id && !isNaN(r.prescription_volume));
        resolve(rows);
      },
      error(err) {
        reject(new Error(err.message));
      },
    });
  });
}

function DropZone({
  label,
  state,
  onFile,
  disabled,
}: {
  label: string;
  state: UploadState;
  onFile: (file: File) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(f: File) {
    if (f.name.endsWith('.csv')) onFile(f);
  }

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
      }}
      className={`
        relative flex flex-col items-center justify-center gap-3
        rounded-xl border-2 border-dashed p-8 cursor-pointer
        transition-all duration-200 select-none
        ${dragging ? 'border-blue-500 bg-blue-50' : ''}
        ${state.data ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40'}
        ${state.error ? 'border-red-400 bg-red-50' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        disabled={disabled}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {state.data ? (
        <>
          <FileCheck2 className="h-10 w-10 text-emerald-500" />
          <div className="text-center">
            <p className="font-semibold text-emerald-700">{label}</p>
            <p className="mt-1 text-sm text-emerald-600 truncate max-w-[200px]">{state.file?.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{state.data.length.toLocaleString()}행 로드됨 · 클릭하여 변경</p>
          </div>
        </>
      ) : state.error ? (
        <>
          <AlertCircle className="h-10 w-10 text-red-400" />
          <div className="text-center">
            <p className="font-semibold text-red-600">{label}</p>
            <p className="mt-1 text-xs text-red-500">{state.error}</p>
          </div>
        </>
      ) : (
        <>
          <UploadCloud className="h-10 w-10 text-slate-400" />
          <div className="text-center">
            <p className="font-semibold text-slate-600">{label}</p>
            <p className="mt-1 text-sm text-slate-400">CSV 파일을 드래그하거나 클릭하여 업로드</p>
          </div>
        </>
      )}
    </div>
  );
}

export default function DataUploader({ onSubmit }: DataUploaderProps) {
  const [prev, setPrev] = useState<UploadState>({ file: null, data: null, error: null });
  const [curr, setCurr] = useState<UploadState>({ file: null, data: null, error: null });

  async function handleFile(file: File, setter: (s: UploadState) => void) {
    setter({ file, data: null, error: null });
    try {
      const data = await parseCSV(file);
      setter({ file, data, error: null });
    } catch (err) {
      setter({ file, data: null, error: err instanceof Error ? err.message : '파싱 오류' });
    }
  }

  const canSubmit = !!prev.data && !!curr.data;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DropZone
          label="전월 데이터 (기준)"
          state={prev}
          onFile={(f) => handleFile(f, setPrev)}
        />
        <DropZone
          label="당월 데이터 (검수 대상)"
          state={curr}
          onFile={(f) => handleFile(f, setCurr)}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={() => prev.data && curr.data && onSubmit(prev.data, curr.data)}
          disabled={!canSubmit}
          size="lg"
          className="gap-2"
        >
          <PlayCircle className="h-5 w-5" />
          정합성 검수 시작
        </Button>
        {!canSubmit && (
          <p className="text-sm text-slate-400">두 파일을 모두 업로드하면 활성화됩니다.</p>
        )}
      </div>
    </div>
  );
}
