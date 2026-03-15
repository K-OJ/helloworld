'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

/**
 * TopHeader — 다국어 토글 + 다크 모드 토글
 * 대시보드 헤더 우측에 배치되는 글로벌 컨트롤 영역
 */
export function TopHeader() {
  const { theme, setTheme } = useTheme();
  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  const [mounted, setMounted] = useState(false);

  // next-themes SSR hydration mismatch 방지
  useEffect(() => setMounted(true), []);

  function toggleLang() {
    setLang((prev) => (prev === 'ko' ? 'en' : 'ko'));
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return (
    <div className="flex items-center gap-1">
      {/* 다국어 토글 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleLang}
        aria-label={`언어 전환: 현재 ${lang === 'ko' ? '한국어' : 'English'}`}
        className="h-8 px-2 text-xs font-mono text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
      >
        <span className={lang === 'ko' ? 'font-bold text-slate-800 dark:text-slate-100' : 'text-slate-400'}>KO</span>
        <span className="mx-0.5 text-slate-300">/</span>
        <span className={lang === 'en' ? 'font-bold text-slate-800 dark:text-slate-100' : 'text-slate-400'}>EN</span>
      </Button>

      {/* 다크 모드 토글 */}
      {mounted && (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}
