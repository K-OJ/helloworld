'use client';

import { useState } from 'react';
import type { UploadResult } from '@/lib/types';

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export function useFileUpload() {
  const [baselineFile, setBaselineFile] = useState<File | null>(null);
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  async function upload() {
    if (!baselineFile || !targetFile) {
      setError('전월 및 당월 파일을 모두 선택해 주세요.');
      return;
    }

    setStatus('uploading');
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('baseline', baselineFile);
      formData.append('target', targetFile);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? '업로드 중 오류가 발생했습니다.');
      }

      setResult(data as UploadResult);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      setStatus('error');
    }
  }

  function reset() {
    setBaselineFile(null);
    setTargetFile(null);
    setStatus('idle');
    setError(null);
    setResult(null);
  }

  return {
    baselineFile,
    targetFile,
    setBaselineFile,
    setTargetFile,
    status,
    error,
    result,
    upload,
    reset,
  };
}
