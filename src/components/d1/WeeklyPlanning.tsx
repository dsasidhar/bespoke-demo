import { useState } from 'react';
import type { ArrivalRow, SegmentKey, SkuDcPlan } from '../../types';
import { SEGMENT_BY_KEY } from '../../data/segments';
import { fmtCs, fmtDollars, fmtPct, fmtWeek, cn, bandBg } from '../../lib/utils';
import {
  Eye, EyeOff, Info, Factory, Truck, Anchor, Ship, Building2, Warehouse,
} from 'lucide-react';

type ViewMode = 'segments' | 'totals' | 'combined';

interface Props {
  plan: SkuDcPlan;
  skuName: string;
  dcLabel: string;
}

const SEGMENT_ICON: Partial<Record<SegmentKey, React.ReactNode>> = {
  production:        <Factory className="size-3.5" />,
  origin_truck:      <Truck className="size-3.5" />,
  origin_port:       <Anchor className="size-3.5" />,
  ocean:             <Ship className="size-3.5" />,
  us_port:           <Anchor className="size-3.5" />,
  us_truck:          <Truck className="size-3.5" />,
  bespoke_wh:        <Building2 className="size-3.5" />,
  wh_to_distributor: <Truck className="size-3.5" />,
  mclane_dc:         <Warehouse className="size-3.5" />,
  mclane_to_retailer:<Truck className="size-3.5" />,
};

export default function WeeklyPlanning({ plan, skuName, dcLabel }: Props) {
  const [view, setView] = useState<ViewMode>('combined');
  const [showShortDated, setShowShortDated] = useState(true);

  const weeks = plan.weeks;
  const N = weeks.length;

  const dohBand = (d: number): 'good' | 'ok' | 'warn' | 'bad' | 'critical' =>
    d < 0 ? 'critical' : d < 7 ? 'bad' : d < 14 ? 'warn' : d < 21 ? 'ok' : 'good';

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-ink-900">Weekly inventory planning</h3>
          <p className="text-xs text-ink-500 mt-0.5">
            {skuName} · {dcLabel} · 12-week horizon · click any cell to drill into source shipment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle view={view} setView={setView} />
          <button
            onClick={() => setShowShortDated(!showShortDated)}
            className="btn"
            title="Toggle short-dated stock visibility"
          >
            {showShortDated ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            Short-dated
          </button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="min-w-full text-xs border-separate border-spacing-0">
          <thead>
            <tr className="text-ink-500">
              <th className="sticky left-0 bg-white z-10 text-left font-medium pl-2 pr-4 py-2 w-64">
                Week beginning
              </th>
              {weeks.map((w, i) => (
                <th
                  key={w.weekStart}
                  className={cn(
                    'px-2 py-2 text-right font-medium tabular-nums',
                    i === 0 && 'text-cocoa-700 font-semibold',
                  )}
                >
                  {fmtWeek(w.weekStart)}
                </th>
              ))}
              <th className="px-2 py-2 text-right font-medium text-ink-500">Notes</th>
            </tr>
          </thead>

          <tbody>
            {/* DEMAND SECTION */}
            <SectionRow label="Demand" />
            <DataRow
              label="Forecast (cs)"
              values={plan.forecastCs.map((v) => ({ display: fmtCs(v) }))}
            />
            <DataRow
              label="Actual demand (POS)"
              values={plan.actualDemandCs.map((v) =>
                v == null ? { display: '—', muted: true } : { display: fmtCs(v) },
              )}
            />

            {/* COVER SECTION */}
            <SectionRow label="Cover" />
            <DataRow
              label="Days on hand"
              values={plan.daysOnHand.map((v) => ({
                display: `${v}`,
                bandBg: bandBg(dohBand(v)),
              }))}
              note="Color: <7d critical · <14d warn · ≥21d good"
            />
            <DataRow
              label="Expected service level"
              values={plan.expectedServiceLevel.map((v) => ({
                display: fmtPct(v, 0),
                bandBg: bandBg(v < 0.85 ? 'critical' : v < 0.95 ? 'bad' : v < 0.97 ? 'warn' : v < 0.99 ? 'ok' : 'good'),
              }))}
            />
            <DataRow
              label="P(SL < 100%)"
              values={plan.probSlBelow['1.0'].map((v) => ({ display: fmtPct(v, 0), muted: v < 0.05 }))}
              indent
            />
            <DataRow
              label="P(SL < 95%)"
              values={plan.probSlBelow['0.95'].map((v) => ({
                display: fmtPct(v, 0),
                bandBg: v > 0.4 ? bandBg('critical') : v > 0.2 ? bandBg('bad') : v > 0.1 ? bandBg('warn') : undefined,
              }))}
              indent
            />
            <DataRow
              label="P(SL < 90%)"
              values={plan.probSlBelow['0.9'].map((v) => ({ display: fmtPct(v, 0), muted: v < 0.05 }))}
              indent
            />

            {/* INVENTORY SECTION */}
            <SectionRow label="Inventory & arrivals" />
            <DataRow
              label="Opening inventory"
              values={plan.openingInventory.map((v) => ({
                display: fmtCs(v),
                bandBg: v <= 0 ? bandBg('critical') : v < plan.forecastCs[0] ? bandBg('warn') : undefined,
              }))}
            />

            {(view === 'totals' || view === 'combined') && (
              <DataRow
                label={view === 'combined' ? 'Total arriving this week' : 'Shipments arriving this week'}
                values={weeks.map((_, i) => {
                  const total = plan.arrivals.reduce((s, r) => s + r.cases[i], 0);
                  return { display: total > 0 ? fmtCs(total) : '—', muted: total === 0, bold: true };
                })}
                bold
              />
            )}

            {(view === 'segments' || view === 'combined') && (
              <>
                <SegmentSubHeader />
                {plan.arrivals
                  .filter((r) => r.cases.some((c) => c > 0))
                  .map((row, idx) => (
                    <TransitRow key={row.fromSegment + idx} row={row} totalCols={N} />
                  ))}
              </>
            )}

            {/* ACTIONS SECTION */}
            <SectionRow label="Actions" />
            <DataRow
              label="Recommended PO"
              values={plan.recommendedOrders.map((v) => ({
                display: v > 0 ? fmtCs(v) : '—',
                muted: v === 0,
                bandBg: v > 0 ? 'bg-amber-50 text-amber-900' : undefined,
              }))}
              note="Suggested NetSuite PO to maintain >21d cover"
            />
            <DataRow
              label="Unable to ship"
              values={plan.unableToShip.map((v) => ({
                display: v > 0 ? fmtCs(v) : '—',
                bandBg: v > 0 ? bandBg('critical') : undefined,
                muted: v === 0,
              }))}
            />
            <DataRow
              label="Expected lost sales $"
              values={plan.expectedLostSales$.map((v) => ({
                display: v > 0 ? fmtDollars(v) : '—',
                muted: v === 0,
                bandBg: v > 50000 ? bandBg('critical') : v > 10000 ? bandBg('bad') : v > 0 ? bandBg('warn') : undefined,
              }))}
            />
            {showShortDated && (
              <DataRow
                label="Short-dated (≤120d remaining)"
                values={plan.shortDated.map((v) => ({
                  display: v > 0 ? fmtCs(v) : '—',
                  muted: v === 0,
                  bandBg: v > 0 ? 'bg-cocoa-100 text-cocoa-800' : undefined,
                }))}
                note="Cases at risk of failing 4-month-remaining contract requirement"
              />
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-ink-50 border border-ink-100 text-[11px] text-ink-500">
        <Info className="size-3.5 mt-0.5 shrink-0" />
        <p>
          <b className="text-ink-700">How to read this:</b>{' '}
          <span className="text-ink-600"><b>By week</b></span> shows the net flow — how much arrives each week.{' '}
          <span className="text-ink-600"><b>By segment</b></span> shows where each in-flight shipment{' '}
          <i>currently sits</i> and when it will arrive at this DC — read each row left-to-right as a journey.{' '}
          <span className="text-ink-600"><b>Combined</b></span> shows both.
        </p>
      </div>
    </div>
  );
}

function ViewToggle({ view, setView }: { view: ViewMode; setView: (v: ViewMode) => void }) {
  return (
    <div className="inline-flex p-0.5 rounded-lg bg-ink-100 text-xs font-medium">
      {(['totals', 'segments', 'combined'] as ViewMode[]).map((v) => (
        <button
          key={v}
          onClick={() => setView(v)}
          className={cn(
            'px-3 py-1 rounded-md transition',
            view === v ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700',
          )}
        >
          {v === 'totals' ? 'By week' : v === 'segments' ? 'By segment' : 'Combined'}
        </button>
      ))}
    </div>
  );
}

function SectionRow({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={14} className="pt-4 pb-1 sticky left-0 bg-white">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">{label}</div>
      </td>
    </tr>
  );
}

function SegmentSubHeader() {
  return (
    <tr>
      <td colSpan={14} className="pt-2 pb-1.5 sticky left-0 bg-white">
        <div className="flex items-center gap-2 text-[11px] text-ink-500">
          <span className="text-ink-400">↳ in-flight shipments —</span>
          <span>each row = one batch of inventory</span>
          <span className="text-ink-300">·</span>
          <span>icon shows where it sits today, chip shows arrival week + cases</span>
        </div>
      </td>
    </tr>
  );
}

interface CellValue {
  display: string;
  bandBg?: string;
  muted?: boolean;
  bold?: boolean;
}

function DataRow({
  label,
  sublabel,
  values,
  note,
  indent,
  bold,
}: {
  label: string;
  sublabel?: string;
  values: CellValue[];
  note?: string;
  indent?: boolean;
  bold?: boolean;
}) {
  return (
    <tr className="border-t border-ink-50 hover:bg-ink-50/40">
      <td className={cn('sticky left-0 bg-white pr-4 py-1.5', indent ? 'pl-6' : 'pl-2')}>
        <div className={cn('flex items-baseline gap-2', bold && 'font-semibold')}>
          <span className={cn('text-ink-700', indent && 'text-ink-500 text-[11px]')}>{label}</span>
          {sublabel && <span className="text-[10px] text-ink-400">· {sublabel}</span>}
        </div>
      </td>
      {values.map((v, i) => (
        <td key={i} className={cn('px-1 py-1', i === 0 && 'border-l border-cocoa-200')}>
          <div
            className={cn(
              'num text-right tabular-nums px-2 py-1 rounded-md transition',
              v.bandBg,
              v.muted && 'text-ink-300',
              !v.bandBg && !v.muted && 'text-ink-800',
              bold && 'font-semibold',
            )}
          >
            {v.display}
          </div>
        </td>
      ))}
      <td className="px-2 text-[10px] text-ink-400 max-w-[180px]">{note}</td>
    </tr>
  );
}

function TransitRow({ row, totalCols }: { row: ArrivalRow; totalCols: number }) {
  const seg = SEGMENT_BY_KEY[row.fromSegment];
  const icon = SEGMENT_ICON[row.fromSegment] ?? <Truck className="size-3.5" />;
  const arrivalIdx = row.cases.findIndex((c) => c > 0);
  const arrivalCases = arrivalIdx >= 0 ? row.cases[arrivalIdx] : 0;
  const etaWeeks = arrivalIdx;

  return (
    <tr className="hover:bg-cocoa-50/40 group">
      {/* Label */}
      <td className="sticky left-0 bg-white pl-6 pr-4 py-2 group-hover:bg-cocoa-50/40 transition">
        <div className="flex items-center gap-2">
          <span className="size-6 rounded-md bg-cocoa-100 text-cocoa-700 grid place-items-center shrink-0">
            {icon}
          </span>
          <div className="leading-tight">
            <div className="text-[12px] font-medium text-ink-800">{seg.short}</div>
            <div className="text-[10px] text-ink-400">
              {etaWeeks === 0
                ? 'arrives this week'
                : `arrives in ${etaWeeks} ${etaWeeks === 1 ? 'wk' : 'wks'} · ${seg.ownedBy}`}
            </div>
          </div>
        </div>
      </td>

      {/* Track + arrival chip across week columns */}
      {Array.from({ length: totalCols }).map((_, i) => {
        const isStart = i === 0;
        const isOnTrack = i < arrivalIdx;
        const isArrival = i === arrivalIdx;
        return (
          <td
            key={i}
            className={cn(
              'relative h-9 align-middle px-0',
              i === 0 && 'border-l border-cocoa-200',
            )}
          >
            {/* horizontal track segment */}
            {(isOnTrack || isArrival) && (
              <span
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 h-0.5 bg-cocoa-300',
                  isStart ? 'left-1/2 right-0' : isArrival ? 'left-0 right-1/2' : 'left-0 right-0',
                )}
              />
            )}
            {/* origin dot at column 0 */}
            {isStart && (
              <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 size-2 rounded-full bg-cocoa-500 ring-2 ring-white z-10" />
            )}
            {/* arrival chip */}
            {isArrival && (
              <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cocoa-700 text-white text-[10px] font-semibold whitespace-nowrap shadow-soft num">
                +{fmtCs(arrivalCases)}
              </span>
            )}
          </td>
        );
      })}

      <td className="px-2 text-[10px] text-ink-400">
        {etaWeeks > 0 ? `${etaWeeks}-wk transit` : '—'}
      </td>
    </tr>
  );
}
