import type { EventReadiness, SkuStatus } from '../../data/dcOps';
import { cn } from '../../lib/utils';

interface Props {
  readinesses: EventReadiness[];
  selectedEventId: string | null;
  onSelect: (id: string) => void;
  horizonWeeks: number;
}

const STATUS_DOT: Record<SkuStatus, string> = {
  healthy:  'bg-emerald-500',
  on_track: 'bg-lime-500',
  at_risk:  'bg-amber-500',
  critical: 'bg-rose-500',
};

const STATUS_BG: Record<SkuStatus, string> = {
  healthy:  'bg-emerald-50 border-emerald-200',
  on_track: 'bg-lime-50 border-lime-200',
  at_risk:  'bg-amber-50 border-amber-200',
  critical: 'bg-rose-50 border-rose-200',
};

const STATUS_LABEL: Record<SkuStatus, string> = {
  healthy:  'Ready',
  on_track: 'Tight',
  at_risk:  'At risk',
  critical: 'Critical',
};

export default function EventTimeline({ readinesses, selectedEventId, onSelect, horizonWeeks }: Props) {
  // We split into in-horizon and beyond-horizon.
  const inHorizon = readinesses.filter((r) => r.event.weekIndex >= 0 && r.event.weekIndex <= horizonWeeks);
  const beyond = readinesses.filter((r) => r.event.weekIndex > horizonWeeks);

  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">What's coming up?</h2>
          <p className="text-xs text-ink-500 mt-0.5">
            Demand events on the calendar for this DC. Click an event for the SKU-by-SKU readiness check.
          </p>
        </div>
      </div>

      <div className="card p-4">
        {/* Track */}
        <div className="relative pt-2 pb-1 px-3">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-ink-200 rounded-full -translate-y-1/2" />
          {/* Today marker (left edge) */}
          <div className="relative flex items-center gap-3 overflow-x-auto pb-2">
            <TodayMarker />
            {inHorizon.map((r) => (
              <EventChip
                key={r.event.id}
                r={r}
                isSelected={r.event.id === selectedEventId}
                onClick={() => onSelect(r.event.id)}
              />
            ))}
          </div>
        </div>

        {beyond.length > 0 && (
          <div className="mt-4 pt-4 border-t border-ink-100">
            <div className="text-[10px] uppercase tracking-wider text-ink-400 font-semibold mb-2">
              Beyond 12-week horizon — plan ahead
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {beyond.map((r) => (
                <button
                  key={r.event.id}
                  onClick={() => onSelect(r.event.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-ink-200 bg-white hover:bg-ink-50 transition text-xs"
                >
                  <span>{r.event.emoji}</span>
                  <span className="font-medium">{r.event.name}</span>
                  <span className="text-ink-400 num">+{r.event.weekIndex}w</span>
                  <span className="pill bg-ink-100 text-ink-600 text-[10px]">PO needed</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function TodayMarker() {
  return (
    <div className="flex flex-col items-center shrink-0 z-10">
      <div className="size-3 rounded-full bg-cocoa-700 ring-4 ring-cocoa-100" />
      <div className="text-[10px] text-cocoa-700 mt-1 font-semibold uppercase tracking-wider">Today</div>
      <div className="text-[10px] text-ink-400 num">Apr 27</div>
    </div>
  );
}

function EventChip({
  r, isSelected, onClick,
}: {
  r: EventReadiness;
  isSelected: boolean;
  onClick: () => void;
}) {
  const dt = new Date(r.event.date + 'T00:00:00Z');
  const dateLabel = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center shrink-0 z-10 group',
        'min-w-[150px]',
      )}
    >
      <span className={cn('size-3.5 rounded-full ring-4 transition', STATUS_DOT[r.overall],
        isSelected ? 'ring-cocoa-200 scale-125' : 'ring-white group-hover:ring-cocoa-100',
      )} />
      <div className={cn(
        'mt-2 px-3 py-2 rounded-lg border min-w-[140px] text-left transition',
        STATUS_BG[r.overall],
        isSelected ? 'shadow-soft border-cocoa-300' : 'group-hover:border-cocoa-300',
      )}>
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none">{r.event.emoji}</span>
          <span className="font-semibold text-ink-900 text-sm">{r.event.name}</span>
        </div>
        <div className="text-[10px] text-ink-500 mt-0.5">
          {dateLabel} · +{r.event.weekIndex}w
        </div>
        <div className="mt-2 pt-1.5 border-t border-current/10 flex items-center justify-between">
          <span className={cn('text-[11px] font-semibold', readinessColor(r.overall))}>
            {STATUS_LABEL[r.overall]}
          </span>
          <span className="text-[10px] text-ink-500 num">
            {r.perSku.filter((p) => p.gap > 0).length}/{r.perSku.length} short
          </span>
        </div>
      </div>
    </button>
  );
}

function readinessColor(s: SkuStatus): string {
  return s === 'critical' ? 'text-rose-700'
    : s === 'at_risk' ? 'text-amber-700'
    : s === 'on_track' ? 'text-lime-700'
    : 'text-emerald-700';
}
