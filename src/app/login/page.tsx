'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [saveId, setSaveId] = useState(false);
  const [error, setError] = useState('');

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (userId === 'test' && password === 'test') {
      // 인증 쿠키 설정 (1일 유효)
      document.cookie = 'autoqa_auth=1; path=/; max-age=86400; SameSite=Lax';
      if (saveId) localStorage.setItem('autoqa_saved_id', userId);
      router.push('/dashboard');
    } else {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">

      {/* 배경 블롭 장식 */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-300 opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/4 h-72 w-72 rounded-full bg-indigo-300 opacity-15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-16 h-56 w-56 rounded-full bg-sky-200 opacity-20 blur-3xl" />

      {/* 좌측: 브랜딩 */}
      <div className="relative flex w-full flex-col justify-center px-12 py-16 md:w-1/2 md:px-20">
        <div className="max-w-md">
          <p className="mb-2 text-sm font-medium tracking-widest text-blue-500 uppercase">
            Data QA Platform
          </p>
          <p className="mb-3 text-xl font-medium text-slate-600 leading-relaxed">
            데이터 검수 담당자를 위한{' '}
            <span className="font-bold text-blue-600">새로운 기준</span>
          </p>

          {/* 로고 */}
          <div className="mb-6">
            <span className="text-5xl font-black tracking-tight text-slate-900">
              <span className="text-blue-600">Auto</span>-QA
            </span>
            <p className="mt-1 text-xl font-semibold tracking-wide text-slate-700">Dashboard</p>
          </div>

          {/* 서브텍스트 */}
          <p className="text-sm leading-7 text-slate-500">
            분산되어 있는 제약 처방 데이터를 통합하고<br />
            AI 기반의 정합성 검수 솔루션을 연계하여 더 효율적인 업무 환경을 서포트 합니다<br />
            수작업 검수의 피로를 덜고 완벽한 데이터 신뢰도를 경험해 보세요.
          </p>

          {/* 데모 안내 */}
          <div className="mt-8 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-600">
            <strong>데모 계정:</strong> 아이디 <code className="rounded bg-blue-100 px-1">test</code> / 비밀번호 <code className="rounded bg-blue-100 px-1">test</code>
          </div>
        </div>
      </div>

      {/* 우측: 로그인 폼 */}
      <div className="flex w-full items-center justify-center px-6 py-16 md:w-1/2 md:px-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-2xl">

          {/* 카드 상단 */}
          <div className="mb-8">
            <p className="text-xl font-semibold leading-snug text-slate-700">
              제약 데이터 품질 검수 플랫폼<br />
              <span className="text-blue-600">Auto-QA</span>가 함께 합니다
            </p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* 아이디 */}
            <div>
              <input
                type="text"
                placeholder="아이디"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                autoComplete="username"
                className="w-full border-0 border-b border-gray-300 bg-transparent pb-2 pt-1 text-sm text-slate-800 placeholder-gray-400 outline-none transition-colors focus:border-blue-600"
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-md border-0 bg-blue-50 px-3 py-2.5 text-sm text-slate-800 placeholder-gray-400 outline-none ring-1 ring-blue-200 transition-colors focus:ring-blue-500"
              />
            </div>

            {/* 에러 메시지 */}
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              className="w-full rounded-md bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
            >
              로그인
            </button>

            {/* 아이디 저장 + 찾기 */}
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 select-none">
                <span
                  onClick={() => setSaveId(!saveId)}
                  className={`flex h-5 w-5 items-center justify-center rounded transition-colors ${
                    saveId ? 'bg-blue-600 text-white' : 'border border-gray-300 bg-white'
                  }`}
                >
                  {saveId && (
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                아이디 저장
              </label>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Link href="/find-id" className="hover:text-slate-600 transition-colors">아이디 찾기</Link>
                <span>|</span>
                <Link href="/find-password" className="hover:text-slate-600 transition-colors">비밀번호 찾기</Link>
              </div>
            </div>
          </form>

          {/* 구분선 + 회원가입 */}
          <div className="mt-8 border-t border-gray-100 pt-6">
            <p className="text-center text-sm text-gray-400">
              아직 Auto-QA의 회원이 아니신가요?{' '}
              <Link href="/signup" className="font-medium text-blue-600 hover:underline">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
