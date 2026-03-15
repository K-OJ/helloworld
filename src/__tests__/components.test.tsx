/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileDropzone } from '@/components/upload/FileDropzone';

describe('FileDropzone 컴포넌트', () => {
  it('레이블과 설명 텍스트가 렌더링됨', () => {
    render(
      <FileDropzone
        label="전월 데이터 (기준)"
        description="이전 달 처방 데이터를 업로드하세요"
        file={null}
        onFileSelect={vi.fn()}
      />
    );
    expect(screen.getByText('전월 데이터 (기준)')).toBeTruthy();
    expect(screen.getByText('이전 달 처방 데이터를 업로드하세요')).toBeTruthy();
  });

  it('파일 없을 때 안내 문구 표시', () => {
    render(
      <FileDropzone
        label="테스트 업로드"
        description="파일을 업로드하세요"
        file={null}
        onFileSelect={vi.fn()}
      />
    );
    expect(screen.getByText('CSV, XLSX, XLS · 최대 50MB')).toBeTruthy();
  });

  it('파일 선택 시 파일명이 표시됨', () => {
    const mockFile = new File(['content'], 'test-data.csv', { type: 'text/csv' });
    render(
      <FileDropzone
        label="전월 데이터"
        description=""
        file={mockFile}
        onFileSelect={vi.fn()}
      />
    );
    expect(screen.getByText('test-data.csv')).toBeTruthy();
  });

  it('파일 input이 accept 속성 포함 (.csv, .xlsx, .xls)', () => {
    const { container } = render(
      <FileDropzone
        label="전월 데이터"
        description=""
        file={null}
        onFileSelect={vi.fn()}
      />
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.accept).toContain('.csv');
    expect(input.accept).toContain('.xlsx');
  });

  it('disabled 상태에서 클릭해도 onFileSelect 미호출', () => {
    const onFileSelect = vi.fn();
    const { container } = render(
      <FileDropzone
        label="전월 데이터"
        description=""
        file={null}
        onFileSelect={onFileSelect}
        disabled={true}
      />
    );
    const dropzone = container.firstChild as HTMLElement;
    fireEvent.click(dropzone);
    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('파일 change 이벤트 → onFileSelect 호출', () => {
    const onFileSelect = vi.fn();
    const { container } = render(
      <FileDropzone
        label="전월 데이터"
        description=""
        file={null}
        onFileSelect={onFileSelect}
      />
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = new File(['data'], 'upload.csv', { type: 'text/csv' });
    fireEvent.change(input, { target: { files: [mockFile] } });
    expect(onFileSelect).toHaveBeenCalledWith(mockFile);
  });
});
