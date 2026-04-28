import { useMemo, useState } from 'react';
import {
  Factory, Anchor, Ship, Building2, Truck, Store, Info, AlertTriangle,
  AlertOctagon, CheckCircle2, X,
} from 'lucide-react';
import type { SegmentKey, SegmentSnapshot } from '../../types';
import { SEGMENT_BY_KEY, SEGMENTS } from '../../data/segments';
import { DISRUPTIONS } from '../../data/disruptions';
import type { DisruptionNote } from '../../data/disruptions';
import { fmtCs, cn } from '../../lib/utils';

interface RibbonNode {
  key: string;
  label: string;
  sublabel: string;
  segments: SegmentKey[];
  icon: React.ReactNode;
  owner: string;
}

const NODES: RibbonNode[] = [
  { key: 'producer',    label: 'Producer',     sublabel: 'Eon (GR) · Lavdas (GR) · Swiss',
    segments: ['production', 'origin_truck'],
    icon: <Factory className="size-4" />,    owner: 'Manufacturer' },
  { key: 'origin_port', label: 'Rotterdam',    sublabel: 'origin port',
    segments: ['origin_port'],
    icon: <Anchor className="size-4" />,     owner: 'Carrier' },
  { key: 'ocean',       label: 'Ocean',        sublabel: '~15 day transit',
    segments: ['ocean'],
    icon: <Ship className="size-4" />,       owner: 'Carrier' },
  { key: 'us_port',     label: 'Newark port',  sublabel: 'US customs · port → 3PL',
    segments: ['us_port', 'us_truck'],
    icon: <Anchor className="size-4" />,     owner: 'Carrier' },
  { key: 'bespoke',     label: 'Bespoke 3PL',  sublabel: 'Newark NJ',
    segments: ['bespoke_wh'],
    icon: <Building2 className="size-4" />,  owner: 'Bespoke' },
  { key: 'mclane',      label: 'McLane',       sublabel: '27 DCs · pass-through',
    segments: ['wh_to_distributor', 'mclane_dc', 'mclane_to_retailer'],
    icon: <Truck className="size-4" />,      owner: 'McLane' },
  { key: 'walmart',     label: 'Walmart',      sublabel: '4,000 stores',
    segments: ['walmart_dc', 'retailer_to_store', 'walmart_store'],
    icon: <Store className="size-4" />,      owner: 'Walmart' },
];

interface NodeData extends RibbonNode {
  cases: number;
  shipments: number;
  eta: number;
  segs: SegmentSnapshot[];
  disruptions: DisruptionNote[];
  /** Recommended share of pipeline cases at this node, derived from segment dwell times. */
  recommendedShare: number;
}

/** Recommended share = node dwell days / total chain dwell days.
 *  Principled, explainable to Walmart: "this is what % of inventory should
 *  be sitting at each node based on average lead time at each stage." */
const TOTAL_CHAIN_DWELL = SEGMENTS.reduce((s, seg) => s + seg.dwellDays, 0);
const RECOMMENDED_SHARE: Record<string, number> = Object.fromEntries(
  NODES.map((n) => [
    n.key,
    n.segments.reduce((s, k) => s + (SEGMENT_BY_KEY[k]?.dwellDays ?? 0), 0) / TOTAL_CHAIN_DWELL,
  ]),
);

export default function PilotRibbon({ snapshot }: { snapshot: SegmentSnapshot[] }) {
  const [openNodeKey, setOpenNodeKey] = useState<string | null>(null);

  const totalCases = snapshot.reduce((s, x) => s + x.cases, 0);
  const totalShipments = snapshot.reduce((s, x) => s + x.shipments, 0);

  const nodeData: NodeData[] = useMemo(() =>
    NODES.map((node) => {
      const segs = node.segments
        .map((k) => snapshot.find((s) => s.segmentKey === k))
        .filter((s): s is SegmentSnapshot => Boolean(s));
      const cases = segs.reduce((sum, s) => sum + s.cases, 0);
      const shipments = segs.reduce((sum, s) => sum + s.shipments, 0);
      const eta = segs.length === 0 ? 0 : Math.min(...segs.map((s) => s.earliestEtaWeek));
      const disruptions = DISRUPTIONS.filter((d) => node.segments.includes(d.segmentKey));
      return { ...node, cases, shipments, eta, segs, disruptions, recommendedShare: RECOMMENDED_SHARE[node.key] };
    }),
    [snapshot],
  );

  const totalDisruptions = nodeData.reduce((s, n) => s + n.disruptions.length, 0);

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold text-ink-900">Pipeline flow — all SKUs · all DCs</h3>
          <p className="text-xs text-ink-500 mt-0.5">
            {fmtCs(totalCases)} cases in motion across {totalShipments} active shipments · 13 segments rolled up to 7 nodes ·
            <span className="ml-1 inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-rose-500" />
              {totalDisruptions} disruption {totalDisruptions === 1 ? 'note' : 'notes'} pinned
            </span>
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 text-[10px] text-ink-500">
          <span>bar = observed % of pipeline</span>
          <span className="flex items-center gap-1">
            <span className="w-px h-3 bg-ink-400/70" />
            recommended
          </span>
        </div>
      </div>

      <div className="flex items-stretch gap-1">
        {nodeData.map((n, i) => (
          <div key={n.key} className="flex items-stretch flex-1 min-w-0">
            <NodeCard node={n} totalCases={totalCases}
                      open={openNodeKey === n.key}
                      onToggle={() => setOpenNodeKey(openNodeKey === n.key ? null : n.key)} />
            {i < nodeData.length - 1 && (
              <div className="flex items-center text-ink-200 text-[10px] px-0.5 shrink-0">›</div>
            )}
          </div>
        ))}
      </div>

      {openNodeKey && (
        <NodeDrawer
          node={nodeData.find((n) => n.key === openNodeKey)!}
          totalCases={totalCases}
          onClose={() => setOpenNodeKey(null)}
        />
      )}
    </div>
  );
}

const SEVERITY_DOT: Record<DisruptionNote['severity'], string> = {
  info:     'bg-ink-400',
  warning:  'bg-amber-500',
  critical: 'bg-rose-500',
  positive: 'bg-emerald-500',
};

function NodeCard({ node, totalCases, open, onToggle }: {
  node: NodeData;
  totalCases: number;
  open: boolean;
  onToggle: () => void;
}) {
  const observedShare = totalCases > 0 ? node.cases / totalCases : 0;
  const observedPct = Math.round(observedShare * 100);
  const recommendedPct = Math.round(node.recommendedShare * 100);
  const deltaPts = observedPct - recommendedPct;
  const deviationBand =
    Math.abs(deltaPts) <= 3 ? 'good' :
    Math.abs(deltaPts) <= 8 ? 'warn' : 'bad';
  const observedColor = {
    good: 'text-ink-900',
    warn: 'text-amber-700',
    bad: 'text-rose-700',
  }[deviationBand];
  const isBespoke = node.key === 'bespoke';
  const worstDisruption = node.disruptions
    .slice()
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))[0];

  return (
    <button
      onClick={onToggle}
      title={`${node.sublabel} · observed ${observedPct}% vs recommended ${recommendedPct}%`}
      className={cn(
        'flex-1 min-w-0 rounded-lg border px-2 py-2 hover:shadow-soft transition text-left relative',
        isBespoke ? 'border-cocoa-300 bg-cocoa-50 hover:border-cocoa-400' :
        open ? 'border-cocoa-500 bg-white shadow-soft' : 'border-ink-100 bg-white hover:border-cocoa-300',
      )}
    >
      {worstDisruption && (
        <span
          className={cn(
            'absolute top-1.5 right-1.5 size-2 rounded-full ring-2 ring-white',
            SEVERITY_DOT[worstDisruption.severity],
          )}
          title={`${node.disruptions.length} note(s) · ${worstDisruption.title}`}
        />
      )}

      <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
        <div className={cn(
          'size-6 rounded-md grid place-items-center shrink-0',
          isBespoke ? 'bg-cocoa-200 text-cocoa-700' : 'bg-ink-100 text-ink-700',
        )}>
          {node.icon}
        </div>
        <div className="text-[11px] font-semibold text-ink-800 truncate">{node.label}</div>
      </div>

      <div className="num text-base font-semibold leading-tight">{fmtCs(node.cases)}</div>
      <div className="text-[10px] leading-tight">
        <span className={cn('num font-semibold', observedColor)}>{observedPct}%</span>
        <span className="text-ink-400"> of pipeline</span>
      </div>
      <div className="text-[10px] text-ink-500 leading-tight">
        recommended <span className="num">{recommendedPct}%</span>
        <span className="mx-1 text-ink-300">·</span>
        {node.shipments} active
      </div>
      <div className="mt-1.5 relative h-1 rounded-full bg-ink-100 overflow-hidden">
        <div
          className={cn('h-full', isBespoke ? 'bg-cocoa-500' : 'bg-ink-700')}
          style={{ width: `${observedPct}%` }}
          title={`observed ${observedPct}%`}
        />
        {/* Recommended marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-ink-400/70"
          style={{ left: `${recommendedPct}%` }}
          title={`recommended ${recommendedPct}%`}
        />
      </div>
    </button>
  );
}

function NodeDrawer({ node, totalCases, onClose }: { node: NodeData; totalCases: number; onClose: () => void }) {
  const observedShare = totalCases > 0 ? (node.cases / totalCases) * 100 : 0;
  return (
    <div className="mt-4 rounded-xl border border-cocoa-200 bg-cocoa-50/50 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-cocoa-700 font-semibold mb-0.5">Node detail</div>
          <h4 className="text-base font-semibold">{node.label} · {node.sublabel}</h4>
          <div className="text-xs text-ink-500 mt-0.5">Owner: <b className="text-ink-700">{node.owner}</b></div>
        </div>
        <button onClick={onClose} className="size-8 rounded-md hover:bg-white/70 grid place-items-center text-ink-400">
          <X className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <Stat label="Inventory at this node" value={`${fmtCs(node.cases)} cs`} sub={`${observedShare.toFixed(1)}% of total pipeline`} />
        <Stat
          label="Recommended share"
          value={`${(node.recommendedShare * 100).toFixed(0)}%`}
          sub="dwell days at node ÷ total chain dwell"
        />
        <Stat label="Active shipments"       value={`${node.shipments}`}    sub="distinct in-flight loads" />
        <Stat label="Earliest ETA"           value={`wk +${node.eta || 0}`} sub="next arrival downstream" />
      </div>

      {/* Sub-segment breakdown */}
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-wider text-ink-400 font-semibold mb-1.5">Sub-segments</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {node.segs.map((s) => (
            <div key={s.segmentKey} className="rounded-lg bg-white border border-ink-100 px-3 py-2 flex items-center justify-between">
              <div className="text-xs text-ink-700">{SEGMENT_BY_KEY[s.segmentKey].name}</div>
              <div className="num text-sm font-semibold">{fmtCs(s.cases)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Disruption notes */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-ink-400 font-semibold mb-1.5">Notes & disruptions</div>
        {node.disruptions.length === 0 ? (
          <div className="text-xs text-ink-500 italic">No active notes for this node.</div>
        ) : (
          <ul className="space-y-2">
            {node.disruptions.map((d) => (
              <li key={d.id} className={cn('rounded-lg border p-3 flex items-start gap-2.5',
                d.severity === 'critical' ? 'border-rose-200 bg-rose-50' :
                d.severity === 'warning' ? 'border-amber-200 bg-amber-50' :
                d.severity === 'positive' ? 'border-emerald-200 bg-emerald-50' :
                'border-ink-200 bg-white',
              )}>
                <SeverityIcon severity={d.severity} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-ink-900">{d.title}</span>
                    <span className="text-[10px] text-ink-400">updated {d.updated}</span>
                    {d.impact && (
                      <span className="pill bg-white border border-ink-200 text-ink-700 text-[10px] num">
                        {d.impact}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-700 mt-1 leading-relaxed">{d.body}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub, accent = 'ink' }: {
  label: string; value: string; sub: string; accent?: 'ink' | 'emerald' | 'amber' | 'rose';
}) {
  const accentText = {
    ink: 'text-ink-900', emerald: 'text-emerald-700', amber: 'text-amber-700', rose: 'text-rose-700',
  }[accent];
  return (
    <div className="rounded-lg bg-white border border-ink-100 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-ink-400">{label}</div>
      <div className={cn('text-base font-semibold mt-0.5 num', accentText)}>{value}</div>
      <div className="text-[11px] text-ink-500 mt-0.5">{sub}</div>
    </div>
  );
}

function SeverityIcon({ severity }: { severity: DisruptionNote['severity'] }) {
  const iconCls = 'size-4 shrink-0 mt-0.5';
  if (severity === 'critical') return <AlertOctagon className={cn(iconCls, 'text-rose-700')} />;
  if (severity === 'warning')  return <AlertTriangle className={cn(iconCls, 'text-amber-700')} />;
  if (severity === 'positive') return <CheckCircle2 className={cn(iconCls, 'text-emerald-700')} />;
  return <Info className={cn(iconCls, 'text-ink-700')} />;
}

function severityRank(s: DisruptionNote['severity']): number {
  return s === 'critical' ? 3 : s === 'warning' ? 2 : s === 'info' ? 1 : 0;
}

