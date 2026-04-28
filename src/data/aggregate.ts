import type { SegmentKey, SegmentSnapshot } from '../types';
import { DCS } from './dcs';
import { SKUS } from './skus';
import { buildDefaultPlan } from './inventory';
import { SEGMENTS } from './segments';

/** Aggregate cases across all SKUs × DCs at the snapshot, by segment. */
export function buildPipelineSnapshot(): SegmentSnapshot[] {
  const totals: Record<SegmentKey, { cases: number; shipments: number; eta: number }> = {} as never;
  for (const seg of SEGMENTS) totals[seg.key] = { cases: 0, shipments: 0, eta: Infinity };

  for (const sku of SKUS) {
    for (const dc of DCS) {
      const plan = buildDefaultPlan(sku.id, dc.id);
      for (const row of plan.arrivals) {
        const total = row.cases.reduce((s, c) => s + c, 0);
        if (total > 0) {
          const target = totals[row.fromSegment];
          target.cases += total;
          target.shipments += row.cases.filter((x) => x > 0).length;
          const etaWeek = row.cases.findIndex((x) => x > 0);
          if (etaWeek >= 0 && etaWeek < target.eta) target.eta = etaWeek;
        }
      }
      // Approximate "at McLane / Walmart DC" stock based on opening inventory share
      totals['mclane_dc'].cases += Math.round(plan.openingInventory[0] * 0.5);
      totals['walmart_dc'].cases += Math.round(plan.openingInventory[0] * 0.2);
      totals['walmart_store'].cases += Math.round(plan.openingInventory[0] * 0.05);
    }
  }

  return SEGMENTS.map((s) => ({
    segmentKey: s.key,
    cases: totals[s.key].cases,
    shipments: totals[s.key].shipments,
    earliestEtaWeek: totals[s.key].eta === Infinity ? 0 : totals[s.key].eta,
  }));
}

/** Aggregate matrix for the heatmap: rows = future-week buckets, columns = DCs.
 *  metric: 'doh' | 'cases' | 'sl' | 'lost' | 'prob_below_95' */
export type AggregateMetric = 'doh' | 'cases' | 'sl' | 'lost' | 'prob_below_95';

export interface DcWeekCell {
  value: number;
  band: 'good' | 'ok' | 'warn' | 'bad' | 'critical';
}

export interface AggregateGrid {
  weeks: { label: string; weekStart: string }[];
  dcs: { id: string; code: string; city: string }[];
  cells: DcWeekCell[][]; // [weekIdx][dcIdx]
  totals: { value: number; band: DcWeekCell['band'] }[]; // per row total
}

export function buildAggregateGrid(skuId: string, metric: AggregateMetric): AggregateGrid {
  const dcs = DCS.map((d) => ({ id: d.id, code: d.code, city: d.city }));
  const weeks = buildDefaultPlan(SKUS[0].id, DCS[0].id).weeks.map((w, i) => ({
    label: i === 0 ? 'This week' : `Week +${i}`,
    weekStart: w.weekStart,
  }));

  const cells: DcWeekCell[][] = weeks.map(() => []);
  const totals: { value: number; band: DcWeekCell['band'] }[] = weeks.map(() => ({ value: 0, band: 'good' }));

  for (const dc of DCS) {
    const plan = buildDefaultPlan(skuId, dc.id);
    for (let w = 0; w < weeks.length; w++) {
      let value = 0;
      let band: DcWeekCell['band'] = 'good';
      switch (metric) {
        case 'doh': {
          value = plan.daysOnHand[w];
          band = value < 0 ? 'critical' : value < 7 ? 'bad' : value < 14 ? 'warn' : value < 21 ? 'ok' : 'good';
          break;
        }
        case 'cases': {
          value = plan.openingInventory[w];
          const cover = plan.openingInventory[w] / Math.max(1, plan.forecastCs[w]);
          band = cover < 0.5 ? 'critical' : cover < 1 ? 'bad' : cover < 1.4 ? 'warn' : cover < 2 ? 'ok' : 'good';
          break;
        }
        case 'sl': {
          value = Math.round(plan.expectedServiceLevel[w] * 100);
          band = value < 80 ? 'critical' : value < 90 ? 'bad' : value < 97 ? 'warn' : value < 99 ? 'ok' : 'good';
          break;
        }
        case 'lost': {
          value = plan.expectedLostSales$[w];
          band = value > 30000 ? 'critical' : value > 10000 ? 'bad' : value > 2000 ? 'warn' : value > 0 ? 'ok' : 'good';
          break;
        }
        case 'prob_below_95': {
          value = Math.round(plan.probSlBelow['0.95'][w] * 100);
          band = value > 40 ? 'critical' : value > 20 ? 'bad' : value > 10 ? 'warn' : value > 5 ? 'ok' : 'good';
          break;
        }
      }
      cells[w].push({ value, band });
      totals[w].value += value;
    }
  }

  // Compute reasonable totals (avg for SL/prob, sum for cases/lost, avg DOH)
  for (let w = 0; w < weeks.length; w++) {
    if (metric === 'sl' || metric === 'prob_below_95' || metric === 'doh') {
      totals[w].value = Math.round(totals[w].value / DCS.length);
    }
    const v = totals[w].value;
    if (metric === 'sl') totals[w].band = v < 80 ? 'critical' : v < 90 ? 'bad' : v < 97 ? 'warn' : v < 99 ? 'ok' : 'good';
    else if (metric === 'doh') totals[w].band = v < 7 ? 'bad' : v < 14 ? 'warn' : v < 21 ? 'ok' : 'good';
    else if (metric === 'lost') totals[w].band = v > 200000 ? 'critical' : v > 50000 ? 'bad' : v > 10000 ? 'warn' : v > 0 ? 'ok' : 'good';
    else if (metric === 'prob_below_95') totals[w].band = v > 40 ? 'critical' : v > 20 ? 'bad' : v > 10 ? 'warn' : v > 5 ? 'ok' : 'good';
    else totals[w].band = 'good';
  }

  return { weeks, dcs, cells, totals };
}

/** Region rollup of the aggregate grid — averages or sums DC-level cells into 5 regions. */
export interface RegionGrid {
  weeks: { label: string; weekStart: string }[];
  regions: { key: string; label: string; dcCount: number }[];
  cells: DcWeekCell[][]; // [weekIdx][regionIdx]
  totals: { value: number; band: DcWeekCell['band'] }[];
}

export function buildRegionGrid(skuId: string, metric: AggregateMetric): RegionGrid {
  const dcGrid = buildAggregateGrid(skuId, metric);
  // Group DCs by region using DC.region (NE/SE/MW/SW/W).
  const REGION_ORDER: Array<{ key: string; label: string }> = [
    { key: 'NE', label: 'Northeast' },
    { key: 'SE', label: 'Southeast' },
    { key: 'MW', label: 'Midwest' },
    { key: 'SW', label: 'Southwest' },
    { key: 'W',  label: 'West' },
  ];
  const dcRegion = Object.fromEntries(DCS.map((d) => [d.id, d.region]));
  const regionDcs: Record<string, number[]> = { NE: [], SE: [], MW: [], SW: [], W: [] };
  dcGrid.dcs.forEach((d, i) => {
    const r = dcRegion[d.id];
    if (r) regionDcs[r].push(i);
  });
  const useAverage = metric === 'sl' || metric === 'prob_below_95' || metric === 'doh';

  const cells: DcWeekCell[][] = dcGrid.weeks.map(() => []);
  for (let w = 0; w < dcGrid.weeks.length; w++) {
    for (const r of REGION_ORDER) {
      const idxs = regionDcs[r.key];
      if (idxs.length === 0) {
        cells[w].push({ value: 0, band: 'good' });
        continue;
      }
      const vals = idxs.map((i) => dcGrid.cells[w][i].value);
      const v = useAverage
        ? Math.round(vals.reduce((s, x) => s + x, 0) / vals.length)
        : Math.round(vals.reduce((s, x) => s + x, 0));
      let band: DcWeekCell['band'] = 'good';
      if (metric === 'doh')      band = v < 7 ? 'bad' : v < 14 ? 'warn' : v < 21 ? 'ok' : 'good';
      else if (metric === 'sl')  band = v < 80 ? 'critical' : v < 90 ? 'bad' : v < 97 ? 'warn' : v < 99 ? 'ok' : 'good';
      else if (metric === 'lost') band = v > 80_000 ? 'critical' : v > 30_000 ? 'bad' : v > 5_000 ? 'warn' : v > 0 ? 'ok' : 'good';
      else if (metric === 'prob_below_95') band = v > 40 ? 'critical' : v > 20 ? 'bad' : v > 10 ? 'warn' : v > 5 ? 'ok' : 'good';
      else if (metric === 'cases') {
        // Cover ratio against approx weekly demand of region (sum of DC weekly demand)
        const totalRegionDemand = idxs.reduce((s, i) => {
          const dc = DCS.find((d) => d.id === dcGrid.dcs[i].id);
          return s + (dc?.weeklyDemandCases || 0);
        }, 0) / 10; // SKU-level demand approx 1/10 of total
        const cover = v / Math.max(1, totalRegionDemand);
        band = cover < 0.5 ? 'critical' : cover < 1 ? 'bad' : cover < 1.4 ? 'warn' : cover < 2 ? 'ok' : 'good';
      }
      cells[w].push({ value: v, band });
    }
  }

  const totals: { value: number; band: DcWeekCell['band'] }[] = dcGrid.weeks.map((_, w) => {
    const vals = cells[w].map((c) => c.value);
    const value = useAverage
      ? Math.round(vals.reduce((s, x) => s + x, 0) / Math.max(1, vals.length))
      : Math.round(vals.reduce((s, x) => s + x, 0));
    let band: DcWeekCell['band'] = 'good';
    if (metric === 'doh')           band = value < 7 ? 'bad' : value < 14 ? 'warn' : value < 21 ? 'ok' : 'good';
    else if (metric === 'sl')       band = value < 80 ? 'critical' : value < 90 ? 'bad' : value < 97 ? 'warn' : value < 99 ? 'ok' : 'good';
    else if (metric === 'lost')     band = value > 200_000 ? 'critical' : value > 80_000 ? 'bad' : value > 10_000 ? 'warn' : value > 0 ? 'ok' : 'good';
    else if (metric === 'prob_below_95') band = value > 40 ? 'critical' : value > 20 ? 'bad' : value > 10 ? 'warn' : value > 5 ? 'ok' : 'good';
    return { value, band };
  });

  return {
    weeks: dcGrid.weeks,
    regions: REGION_ORDER.map((r) => ({ key: r.key, label: r.label, dcCount: regionDcs[r.key].length })),
    cells,
    totals,
  };
}

/** Apply a McLane override to the aggregate grid. Adds `extraCases` to McLane DC stock,
 *  reducing OOS risk. The simplest model: inject extra opening-inventory at week 0 across all DCs
 *  proportional to their share of weekly demand, then re-derive bands.
 *  Returns a *new* grid; the original is untouched. */
export function applyMcLaneOverride(grid: AggregateGrid, extraCases: number, metric: AggregateMetric): AggregateGrid {
  if (extraCases <= 0) return grid;
  const totalDemand = DCS.reduce((s, d) => s + d.weeklyDemandCases, 0);
  // distribute the extra cases pro-rata to DC weekly demand
  const newCells = grid.cells.map((row, wi) =>
    row.map((cell, di) => {
      const dc = DCS.find((d) => d.id === grid.dcs[di].id);
      if (!dc) return cell;
      const extra = (extraCases * dc.weeklyDemandCases) / Math.max(1, totalDemand);
      const decay = Math.max(0, 1 - wi * 0.15); // extra mostly helps near-term weeks
      let v = cell.value;
      if (metric === 'cases') v = cell.value + extra * decay;
      else if (metric === 'doh') {
        const skuDemandPerWeek = dc.weeklyDemandCases / 10;
        v = cell.value + (extra * decay / skuDemandPerWeek) * 7;
      } else if (metric === 'lost') {
        v = Math.max(0, cell.value - extra * decay * 10);
      } else if (metric === 'sl') {
        v = Math.min(100, cell.value + (extra > 5000 ? 6 : extra > 2000 ? 3 : 1) * decay);
      } else if (metric === 'prob_below_95') {
        v = Math.max(0, cell.value - (extra > 5000 ? 18 : extra > 2000 ? 9 : 3) * decay);
      }
      let band: DcWeekCell['band'] = 'good';
      if (metric === 'doh') band = v < 7 ? 'bad' : v < 14 ? 'warn' : v < 21 ? 'ok' : 'good';
      else if (metric === 'sl') band = v < 80 ? 'critical' : v < 90 ? 'bad' : v < 97 ? 'warn' : v < 99 ? 'ok' : 'good';
      else if (metric === 'lost') band = v > 30_000 ? 'critical' : v > 10_000 ? 'bad' : v > 2_000 ? 'warn' : v > 0 ? 'ok' : 'good';
      else if (metric === 'prob_below_95') band = v > 40 ? 'critical' : v > 20 ? 'bad' : v > 10 ? 'warn' : v > 5 ? 'ok' : 'good';
      else if (metric === 'cases') {
        const weeklyDemand = dc.weeklyDemandCases / 10;
        const cover = v / Math.max(1, weeklyDemand);
        band = cover < 0.5 ? 'critical' : cover < 1 ? 'bad' : cover < 1.4 ? 'warn' : cover < 2 ? 'ok' : 'good';
      }
      return { value: Math.round(v), band };
    }),
  );
  return { ...grid, cells: newCells };
}
