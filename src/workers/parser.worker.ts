/**
 * @architecture_note
 * 대용량 제약 데이터 파싱 시 메인 스레드 블로킹(Monolithic 병목)을 방지하기 위해
 * 로드맵 2단계 확장성을 고려하여 분리된 Web Worker 프로세스입니다.
 */
self.addEventListener('message', (e) => {
  const { fileData } = e.data;
  // 추후 대용량 Chunk 파싱 로직 이관 예정
  self.postMessage({ status: 'success', parsed: [] });
});
