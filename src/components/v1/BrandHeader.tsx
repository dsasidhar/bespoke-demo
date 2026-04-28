import { Star, Zap } from 'lucide-react';
import { PILOT_BRAND } from '../../data/skus';
import { NETWORK } from '../../data/dcs';

export default function BrandHeader({ snapshotLabel }: { snapshotLabel: string }) {
  return (
    <div className="card p-5 lg:p-6 bg-gradient-to-br from-ink-900 to-ink-800 text-white border-ink-700">
      <div className="flex flex-wrap items-start gap-5">
        <div className="size-12 rounded-xl bg-amber-400/20 grid place-items-center shrink-0">
          <Star className="size-6 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-[11px] uppercase tracking-wider text-white/55">v0 Pilot · Better Goods · Walmart sourcing</span>
            <span className="pill bg-amber-400/15 text-amber-300 border border-amber-400/30 text-[10px]">
              <Zap className="size-3" /> Consolidated build
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight">
            {PILOT_BRAND.importerName} × {PILOT_BRAND.retailerName} {PILOT_BRAND.privateLabel} pipeline
          </h1>
          <p className="text-sm text-white/65 mt-1.5 max-w-3xl leading-relaxed">
            End-to-end visibility for the {PILOT_BRAND.privateLabel} private-label program: {PILOT_BRAND.productLine},
            sourced from {PILOT_BRAND.sourcing}, distributed through {NETWORK.totalMcLaneDCs} McLane DCs to Walmart's {NETWORK.totalWalmartStores.toLocaleString()} stores.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 ml-auto">
          <Mini label="Snapshot"       value={snapshotLabel} />
          <Mini label="PO lead time"   value={`${PILOT_BRAND.poLeadWeeks} wks`} sub="Greek/Swiss supplier" />
          <Mini label="Ocean transit"  value={`${PILOT_BRAND.oceanTransitDays} days`} sub="Rotterdam → Newark" />
          <Mini label="McLane network" value={`${NETWORK.totalMcLaneDCs} DCs`} sub={`${NETWORK.totalWalmartStores.toLocaleString()} stores`} />
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 min-w-[110px]">
      <div className="text-[10px] text-white/55 uppercase tracking-wider">{label}</div>
      <div className="text-sm font-semibold num">{value}</div>
      {sub && <div className="text-[10px] text-white/45">{sub}</div>}
    </div>
  );
}
