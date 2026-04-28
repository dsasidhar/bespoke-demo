import { Factory, Anchor, Ship, Building2, Truck, Store, ChevronRight } from 'lucide-react';
import type { SegmentSnapshot, SegmentKey } from '../../types';
import { SEGMENT_BY_KEY } from '../../data/segments';
import { fmtCs } from '../../lib/utils';

interface RibbonNode {
  key: string;
  label: string;
  segments: SegmentKey[];
  icon: React.ReactNode;
  owner: string;
}

const NODES: RibbonNode[] = [
  { key: 'producer',    label: 'Swiss producer',  segments: ['production', 'origin_truck'],                          icon: <Factory className="size-4" />,    owner: 'Manufacturer' },
  { key: 'origin_port', label: 'Origin port',     segments: ['origin_port'],                                          icon: <Anchor className="size-4" />,     owner: 'Carrier' },
  { key: 'ocean',       label: 'Ocean',           segments: ['ocean'],                                                icon: <Ship className="size-4" />,       owner: 'Carrier' },
  { key: 'us_port',     label: 'US port',         segments: ['us_port', 'us_truck'],                                  icon: <Anchor className="size-4" />,     owner: 'Carrier' },
  { key: 'bespoke',     label: 'Bespoke WH',      segments: ['bespoke_wh'],                                           icon: <Building2 className="size-4" />,  owner: 'Bespoke' },
  { key: 'mclane',      label: 'McLane DC',       segments: ['wh_to_distributor', 'mclane_dc', 'mclane_to_retailer'], icon: <Truck className="size-4" />,      owner: 'McLane' },
  { key: 'walmart',     label: 'Walmart',         segments: ['walmart_dc', 'retailer_to_store', 'walmart_store'],     icon: <Store className="size-4" />,      owner: 'Walmart' },
];

interface NodeData extends RibbonNode {
  cases: number;
  shipments: number;
  eta: number;
  segs: SegmentSnapshot[];
}

export default function PipelineRibbon({ snapshot }: { snapshot: SegmentSnapshot[] }) {
  const totalCases = snapshot.reduce((s, x) => s + x.cases, 0);
  const totalShipments = snapshot.reduce((s, x) => s + x.shipments, 0);

  const nodeData: NodeData[] = NODES.map((node) => {
    const segs = node.segments
      .map((k) => snapshot.find((s) => s.segmentKey === k))
      .filter((s): s is SegmentSnapshot => Boolean(s));
    const cases = segs.reduce((sum, s) => sum + s.cases, 0);
    const shipments = segs.reduce((sum, s) => sum + s.shipments, 0);
    const eta = segs.length === 0 ? 0 : Math.min(...segs.map((s) => s.earliestEtaWeek));
    return { ...node, cases, shipments, eta, segs };
  });

  const max = Math.max(1, ...nodeData.map((n) => n.cases));

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-ink-700">Pipeline flow — all SKUs · all DCs</h3>
          <p className="text-xs text-ink-400 mt-0.5">
            {fmtCs(totalCases)} cases in motion across {totalShipments} active shipments · 13 segments rolled up to 7 nodes
          </p>
        </div>
      </div>

      <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
        {nodeData.map((n, i) => (
          <div key={n.key} className="flex items-stretch gap-1 min-w-fit">
            <NodeCard node={n} max={max} />
            {i < nodeData.length - 1 && (
              <div className="flex items-center text-ink-300">
                <ChevronRight className="size-5" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function NodeCard({ node, max }: { node: NodeData; max: number }) {
  const pct = max > 0 ? (node.cases / max) * 100 : 0;
  const isBespoke = node.key === 'bespoke';
  return (
    <div className={`flex-1 min-w-[148px] rounded-xl border ${isBespoke ? 'border-cocoa-300 bg-cocoa-50' : 'border-ink-100 bg-white'} p-3 hover:shadow-soft transition`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`size-7 rounded-md grid place-items-center ${isBespoke ? 'bg-cocoa-200 text-cocoa-700' : 'bg-ink-100 text-ink-700'}`}>{node.icon}</div>
        <div className="text-xs font-semibold text-ink-800 leading-tight">{node.label}</div>
      </div>
      <div className="num text-xl font-semibold">{fmtCs(node.cases)}</div>
      <div className="text-[11px] text-ink-500">cases</div>
      <div className="mt-2 h-1.5 rounded-full bg-ink-100 overflow-hidden">
        <div className={`h-full ${isBespoke ? 'bg-cocoa-500' : 'bg-ink-700'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-ink-500">
        <span>{node.shipments} active</span>
        <span>{node.eta === 0 ? 'in stock' : `+${node.eta}w out`}</span>
      </div>
      <div className="mt-2 pt-2 border-t border-ink-100 space-y-0.5">
        {node.segs.map((s) => (
          <div key={s.segmentKey} className="flex justify-between text-[10px] text-ink-400">
            <span className="truncate">{SEGMENT_BY_KEY[s.segmentKey].short}</span>
            <span className="num">{fmtCs(s.cases)}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-1.5 border-t border-ink-100 text-[10px] text-ink-400">{node.owner}</div>
    </div>
  );
}
