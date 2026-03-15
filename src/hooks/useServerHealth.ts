'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * SWR을 활용한 서버 헬스 상태 캐싱 훅
 * - 60초마다 백그라운드에서 자동 재검증(Revalidation)
 * - 탭 포커스 시 불필요한 재요청 방지
 */
export function useServerHealth() {
  const { data, error, isLoading } = useSWR('/api/health', fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  });

  return {
    isHealthy: data?.status === 'ok',
    isLoading,
    isError: !!error,
  };
}
