'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  const [form, setForm] = useState({
    userId: '',
    password: '',
    confirmPassword: '',
    name: '',
    email: '',
    department: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  }

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!form.userId) newErrors.userId = '아이디를 입력해주세요.';
    else if (form.userId.length < 4) newErrors.userId = '아이디는 4자 이상이어야 합니다.';
    if (!form.password) newErrors.password = '비밀번호를 입력해주세요.';
    else if (form.password.length < 6) newErrors.password = '비밀번호는 6자 이상이어야 합니다.';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    if (!form.name) newErrors.name = '이름을 입력해주세요.';
    if (!form.email) newErrors.email = '이메일을 입력해주세요.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = '올바른 이메일 형식이 아닙니다.';
    return newErrors;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-7 w-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xl font-semibold text-slate-800">회원가입이 완료되었습니다</p>
          <p className="text-sm text-slate-500">
            <strong className="text-slate-700">{form.name}</strong> 님, Auto-QA에 오신 것을 환영합니다.<br />
            관리자 승인 후 서비스를 이용하실 수 있습니다.
          </p>
          <Link href="/login" className="block w-full rounded-md bg-blue-600 py-2.5 text-sm font-semibold text-white text-center hover:bg-blue-700 transition-colors">
            로그인 페이지로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/login" className="text-2xl font-black tracking-tight text-slate-900">
            <span className="text-blue-600">Auto</span>-QA
          </Link>
          <p className="mt-1 text-sm text-slate-500">데이터 QA 플랫폼 회원가입</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="mb-1 text-lg font-semibold text-slate-800">회원가입</h2>
          <p className="mb-6 text-sm text-slate-500">데이터 검수 담당자로 가입하세요.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 아이디 */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">아이디 <span className="text-red-400">*</span></label>
              <input
                name="userId"
                type="text"
                placeholder="4자 이상"
                value={form.userId}
                onChange={handleChange}
                className={`w-full rounded-md border px-3 py-2.5 text-sm text-slate-800 placeholder-gray-400 outline-none transition-colors focus:ring-1 ${errors.userId ? 'border-red-300 bg-red-50 focus:ring-red-200' : 'border-gray-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-200'}`}
              />
              {errors.userId && <p className="mt-1 text-xs text-red-500">{errors.userId}</p>}
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">비밀번호 <span className="text-red-400">*</span></label>
              <input
                name="password"
                type="password"
                placeholder="6자 이상"
                value={form.password}
                onChange={handleChange}
                className={`w-full rounded-md border px-3 py-2.5 text-sm text-slate-800 placeholder-gray-400 outline-none transition-colors focus:ring-1 ${errors.password ? 'border-red-300 bg-red-50 focus:ring-red-200' : 'border-gray-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-200'}`}
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">비밀번호 확인 <span className="text-red-400">*</span></label>
              <input
                name="confirmPassword"
                type="password"
                placeholder="비밀번호 재입력"
                value={form.confirmPassword}
                onChange={handleChange}
                className={`w-full rounded-md border px-3 py-2.5 text-sm text-slate-800 placeholder-gray-400 outline-none transition-colors focus:ring-1 ${errors.confirmPassword ? 'border-red-300 bg-red-50 focus:ring-red-200' : 'border-gray-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-200'}`}
              />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>

            {/* 이름 */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">이름 <span className="text-red-400">*</span></label>
              <input
                name="name"
                type="text"
                placeholder="실명 입력"
                value={form.name}
                onChange={handleChange}
                className={`w-full rounded-md border px-3 py-2.5 text-sm text-slate-800 placeholder-gray-400 outline-none transition-colors focus:ring-1 ${errors.name ? 'border-red-300 bg-red-50 focus:ring-red-200' : 'border-gray-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-200'}`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* 이메일 */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">이메일 <span className="text-red-400">*</span></label>
              <input
                name="email"
                type="email"
                placeholder="업무용 이메일"
                value={form.email}
                onChange={handleChange}
                className={`w-full rounded-md border px-3 py-2.5 text-sm text-slate-800 placeholder-gray-400 outline-none transition-colors focus:ring-1 ${errors.email ? 'border-red-300 bg-red-50 focus:ring-red-200' : 'border-gray-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-200'}`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* 부서 */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">담당 부서</label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors"
              >
                <option value="">선택 (선택사항)</option>
                <option value="data">데이터사업팀</option>
                <option value="panel">패널관리팀</option>
                <option value="qa">QA팀</option>
                <option value="marketing">마케팅팀</option>
                <option value="sales">영업관리팀</option>
                <option value="other">기타</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors mt-2"
            >
              회원가입
            </button>
          </form>

          <div className="mt-6 flex justify-center gap-4 text-xs text-gray-400">
            <Link href="/login" className="hover:text-slate-600 transition-colors">로그인</Link>
            <span>|</span>
            <Link href="/find-id" className="hover:text-slate-600 transition-colors">아이디 찾기</Link>
            <span>|</span>
            <Link href="/find-password" className="hover:text-slate-600 transition-colors">비밀번호 찾기</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
