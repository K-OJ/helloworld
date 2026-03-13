import { cn } from '@/lib/utils';
import { SEVERITY_COLORS, SEVERITY_LABELS } from '@/lib/constants';
import type { Severity } from '@/lib/types';

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', SEVERITY_COLORS[severity])}>
      {SEVERITY_LABELS[severity]}
    </span>
  );
}
