'use client';

import { useQAStore } from '@/store/useQAStore';
import { dict } from '@/lib/i18n/dict';

export function useLang() {
  const lang = useQAStore((s) => s.lang);
  return { lang, t: dict[lang] };
}
