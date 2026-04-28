export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function fmtCs(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString('en-US');
}

export function fmtDollars(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 10_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

export function fmtPct(n: number, digits = 0): string {
  return `${(n * 100).toFixed(digits)}%`;
}

export function fmtWeek(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  const m = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  const day = d.getUTCDate();
  return `${m} ${day}`;
}

export function bandBg(band: 'good' | 'ok' | 'warn' | 'bad' | 'critical'): string {
  return {
    good: 'bg-emerald-100 text-emerald-900',
    ok: 'bg-lime-100 text-lime-900',
    warn: 'bg-amber-100 text-amber-900',
    bad: 'bg-orange-200 text-orange-900',
    critical: 'bg-rose-200 text-rose-900',
  }[band];
}

export function bandDot(band: 'good' | 'ok' | 'warn' | 'bad' | 'critical'): string {
  return {
    good: 'bg-emerald-500',
    ok: 'bg-lime-500',
    warn: 'bg-amber-500',
    bad: 'bg-orange-500',
    critical: 'bg-rose-500',
  }[band];
}
