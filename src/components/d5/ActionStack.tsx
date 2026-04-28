import { ArrowRight, AlertOctagon, AlertTriangle, Lightbulb } from 'lucide-react';
import type { RecommendedAction } from '../../data/dcOps';
import { cn } from '../../lib/utils';

interface Props { actions: RecommendedAction[]; }

export default function ActionStack({ actions }: Props) {
  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">What should you do?</h2>
          <p className="text-xs text-ink-500 mt-0.5">
            Ranked by urgency and DC impact. One-click drafts notifications to Bespoke.
          </p>
        </div>
        <div className="text-[11px] text-ink-500">
          {actions.filter((a) => a.priority === 'high').length} high priority ·
          {' '}{actions.filter((a) => a.priority === 'medium').length} medium ·
          {' '}{actions.filter((a) => a.priority === 'low').length} low
        </div>
      </div>

      {actions.length === 0 ? (
        <div className="card p-6 text-sm text-ink-500 text-center">
          You're in great shape. No actions needed at this DC right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {actions.map((a) => (
            <ActionCard key={a.id} a={a} />
          ))}
        </div>
      )}
    </section>
  );
}

const STYLE: Record<RecommendedAction['priority'], { bg: string; border: string; text: string; pill: string; icon: React.ReactNode }> = {
  high:   { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-700',    pill: 'bg-rose-100 text-rose-800',       icon: <AlertOctagon className="size-5" /> },
  medium: { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   pill: 'bg-amber-100 text-amber-800',     icon: <AlertTriangle className="size-5" /> },
  low:    { bg: 'bg-ink-50',     border: 'border-ink-200',     text: 'text-ink-700',     pill: 'bg-ink-100 text-ink-700',         icon: <Lightbulb className="size-5" /> },
};

function ActionCard({ a }: { a: RecommendedAction }) {
  const s = STYLE[a.priority];
  return (
    <div className={cn('rounded-xl border p-4', s.bg, s.border)}>
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5', s.text)}>{s.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={cn('pill', s.pill)}>{a.priority}</span>
            {a.deadline && <span className="pill bg-white/80 text-ink-700 border border-ink-200">decide {a.deadline}</span>}
            {a.metric && <span className="pill bg-white/80 text-ink-700 border border-ink-200">{a.metric.label} {a.metric.value}</span>}
          </div>
          <h4 className="font-semibold text-ink-900 leading-snug">{a.title}</h4>
          <p className="text-sm text-ink-700 mt-1 leading-relaxed">{a.body}</p>
          <p className="text-xs text-ink-500 mt-1.5 italic">{a.rationale}</p>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <button className="btn-primary">
              {a.ctaPrimary} <ArrowRight className="size-4" />
            </button>
            {a.ctaSecondary && <button className="btn">{a.ctaSecondary}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
