'use client';

/**
 * useDashboardData — SWR 기반 대시보드 데이터 캐싱 훅
 *
 * 헬스 체크 및 서버 메타데이터를 SWR로 관리하여
 * 클라이언트 사이드 캐싱 및 자동 재검증(revalidation)을 구현합니다.
 *
 * @module useDashboardData
 */

import useSWR from 'swr';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface HealthData {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  environment: string;
}

// ────────────────────────────────────────────────────────────
// Fetcher
// ────────────────────────────────────────────────────────────

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

// ────────────────────────────────────────────────────────────
// Hooks
// ────────────────────────────────────────────────────────────

/**
 * 서버 헬스 상태를 주기적으로 폴링합니다 (SWR 캐싱 + 자동 갱신).
 *
 * @param enabled - 폴링 활성화 여부 (기본값: false, 서버 상태 확인 필요 시 true)
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useServerHealth(true);
 * if (data?.status === 'ok') console.log('서버 정상');
 * ```
 */
export function useServerHealth(enabled = false) {
  const { data, error, isLoading } = useSWR<HealthData>(
    enabled ? '/api/health' : null,
    fetcher,
    {
      refreshInterval: 60_000,    // 1분마다 자동 갱신
      revalidateOnFocus: false,   // 탭 포커스 시 재검증 비활성화
      dedupingInterval: 30_000,   // 30초 내 중복 요청 방지 (캐싱)
    }
  );

  return {
    data,
    isLoading,
    isError: !!error,
    isHealthy: data?.status === 'ok',
  };
}

/**
 * 분석 API에 SWR mutate 패턴을 활용한 서버 상태 동기화 훅.
 *
 * 분석 결과가 이미 캐시에 존재하면 API 재호출 없이 즉시 반환하여
 * 불필요한 Claude API 토큰 소비를 방지합니다 (한계비용 최소화 전략).
 *
 * @param cacheKey - SWR 캐시 키 (undefined이면 비활성화)
 *
 * @example
 * ```tsx
 * const key = baselineFile && targetFile ? `analyze-${baselineFile.name}-${targetFile.name}` : undefined;
 * const { data, trigger } = useAnalysisCache(key);
 * ```
 */
export function useAnalysisCache<T>(cacheKey: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<T>(
    cacheKey ?? null,
    null, // 직접 fetch하지 않음 — mutate로만 데이터 주입
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3_600_000, // 1시간 캐싱 (동일 파일 재분석 방지)
    }
  );

  /**
   * 캐시에 분석 결과를 저장합니다.
   * 동일 파일을 다시 분석하면 캐시에서 즉시 반환됩니다.
   */
  const setCache = (result: T) => mutate(result, { revalidate: false });

  return {
    cachedData: data,
    isLoading,
    isError: !!error,
    setCache,
    clearCache: () => mutate(undefined, { revalidate: false }),
  };
}
