'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FindIdPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/login" className="text-2xl font-black tracking-tight text-slate-900">
            <span className="text-blue-600">Auto</span>-QA
          </Link>
          <p className="mt-1 text-sm text-slate-500">아이디 찾기</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-7 w-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-semibold text-slate-800">이메일로 아이디를 발송했습니다</p>
              <p className="text-sm text-slate-500">
                <strong className="text-slate-700">{email}</strong> 로 등록된 아이디 정보를 전송했습니다.<br />
                이메일을 확인해 주세요.
              </p>
              <p className="text-xs text-slate-400 bg-slate-50 rounded p-2">
                데모 계정 아이디: <strong>test</strong>
              </p>
              <Link href="/login" className="block w-full rounded-md bg-blue-600 py-2.5 text-sm font-semibold text-white text-center hover:bg-blue-700 transition-colors">
                로그인으로 돌아가기
              </Link>
            </div>
          ) : (
            <>
              <h2 className="mb-1 text-lg font-semibold text-slate-800">아이디 찾기</h2>
              <p className="mb-6 text-sm text-slate-500">가입 시 등록한 이름과 이메일로 아이디를 찾을 수 있습니다.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">이름</label>
                  <input
                    type="text"
                    placeholder="가입 시 등록한 이름"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-md border border-gray-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">이메일</label>
                  <input
                    type="email"
                    placeholder="가입 시 등록한 이메일"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-md border border-gray-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-md bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  아이디 찾기
                </button>
              </form>

              <div className="mt-6 flex justify-center gap-4 text-xs text-gray-400">
                <Link href="/login" className="hover:text-slate-600 transition-colors">로그인</Link>
                <span>|</span>
                <Link href="/find-password" className="hover:text-slate-600 transition-colors">비밀번호 찾기</Link>
                <span>|</span>
                <Link href="/signup" className="hover:text-slate-600 transition-colors">회원가입</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
