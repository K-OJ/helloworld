import { describe, it, expect } from 'vitest';
import { suggestMapping } from '@/lib/suggest-mapping';

describe('suggestMapping - 한글 컬럼 자동 매핑', () => {
  it('표준 한글 컬럼명 → 모든 필드 매핑', () => {
    const headers = ['품목코드', '품목명', '요양기관번호', '처방량', '기준년월'];
    const result = suggestMapping(headers);
    expect(result.drug_id).toBe('품목코드');
    expect(result.drug_name).toBe('품목명');
    expect(result.hospital_code).toBe('요양기관번호');
    expect(result.prescription_volume).toBe('처방량');
    expect(result.date).toBe('기준년월');
  });

  it('영문 표준 컬럼명 → 매핑', () => {
    const headers = ['drug_id', 'drug_name', 'hospital_code', 'prescription_volume', 'date'];
    const result = suggestMapping(headers);
    expect(result.drug_id).toBe('drug_id');
    expect(result.hospital_code).toBe('hospital_code');
  });

  it('대소문자 무관하게 매핑', () => {
    const headers = ['DRUG_ID', 'DRUG_NAME', 'HOSPITAL_CODE', 'PRESCRIPTION_VOLUME', 'DATE'];
    const result = suggestMapping(headers);
    expect(result.drug_id).toBe('DRUG_ID');
    expect(result.hospital_code).toBe('HOSPITAL_CODE');
  });

  it('알 수 없는 컬럼만 있을 때 → 빈 객체 반환', () => {
    const headers = ['unknown_col1', 'random_field', 'xyz'];
    const result = suggestMapping(headers);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('일부만 매핑 가능한 경우 → 매핑 가능한 것만 반환', () => {
    const headers = ['품목코드', '알수없는컬럼1', '알수없는컬럼2'];
    const result = suggestMapping(headers);
    expect(result.drug_id).toBe('품목코드');
    expect(result.drug_name).toBeUndefined();
  });
});
