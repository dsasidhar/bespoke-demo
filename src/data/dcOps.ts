import type { SKU, SkuDcPlan } from '../types';
import { SKUS } from './skus';
import { DC_BY_ID } from './dcs';
import { buildDefaultPlan } from './inventory';
import { EVENTS, ALL_EVENTS, liftForSku } from './events';
import type { DemandEvent } from './events';

export type SkuStatus = 'healthy' | 'on_track' | 'at_risk' | 'critical';

export interface SkuStatusAtDc {
  skuId: string;
  sku: SKU;
  /** Cases physically on-hand at the DC right now. */
  casesNow: number;
  /** Days of cover at current burn rate. */
  dohNow: number;
  /** Weekly burn rate (forecast cs / wk). */
  burnRate: number;
  status: SkuStatus;
  /** Earliest week (0..N-1) at which projected on-hand hits 0; null if never within horizon. */
  oosWeek: number | null;
  /** Next inbound shipment to this DC: cases + week index (0..N-1). */
  nextArrival: { weekIndex: number; cases: number } | null;
  /** Total cases inbound to this DC over the horizon. */
  totalInbound: number;
  /** 12-week expected lost sales $. */
  lostSales12wk: number;
  /** Service level over horizon. */
  avgServiceLevel: number;
  /** Underlying plan (handy for charts / drill-ins). */
  plan: SkuDcPlan;
}

/** Compute status banding from DOH + future projection. */
function statusFor(plan: SkuDcPlan): SkuStatus {
  const oosIn = plan.openingInventory.findIndex((v, i) => i > 0 && v <= 0);
  if (oosIn >= 0 && oosIn <= 3) return 'critical';
  if (oosIn > 0 && oosIn <= 8) return 'at_risk';
  if (plan.daysOnHand[0] < 14) return 'at_risk';
  if (plan.daysOnHand[0] < 21) return 'on_track';
  return 'healthy';
}

export function buildDcStatuses(dcId: string): SkuStatusAtDc[] {
  return SKUS.map((sku) => {
    const plan = buildDefaultPlan(sku.id, dcId);
    const oosWeek = plan.openingInventory.findIndex((v, i) => i > 0 && v <= 0);
    const nextArrivalRow = plan.arrivals
      .map((row) => ({ row, idx: row.cases.findIndex((c) => c > 0) }))
      .filter(({ idx }) => idx >= 0)
      .sort((a, b) => a.idx - b.idx)[0];
    return {
      skuId: sku.id,
      sku,
      casesNow: plan.openingInventory[0],
      dohNow: plan.daysOnHand[0],
      burnRate: plan.forecastCs[0],
      status: statusFor(plan),
      oosWeek: oosWeek >= 0 ? oosWeek : null,
      nextArrival: nextArrivalRow
        ? { weekIndex: nextArrivalRow.idx, cases: nextArrivalRow.row.cases[nextArrivalRow.idx] }
        : null,
      totalInbound: plan.arrivals.reduce(
        (s, r) => s + r.cases.reduce((ss, c) => ss + c, 0),
        0,
      ),
      lostSales12wk: plan.expectedLostSales$.reduce((s, v) => s + v, 0),
      avgServiceLevel:
        plan.expectedServiceLevel.reduce((s, v) => s + v, 0) / plan.expectedServiceLevel.length,
      plan,
    };
  });
}

export type EventReadiness = {
  event: DemandEvent;
  /** Status worse case across SKUs. */
  overall: SkuStatus;
  perSku: {
    sku: SKU;
    /** Required cases over the lead-up window (weeksBefore through event week). */
    required: number;
    /** Projected available cases over the same window. */
    projected: number;
    gap: number; // > 0 means short
    status: SkuStatus;
    lift: number;
  }[];
  /** Total $ at risk if gap not closed. */
  exposureUsd: number;
  /** Latest week to act by (event week - lead). */
  decisionWeek: number;
};

const STATUS_WORST_RANK: Record<SkuStatus, number> = {
  critical: 3, at_risk: 2, on_track: 1, healthy: 0,
};
function worse(a: SkuStatus, b: SkuStatus): SkuStatus {
  return STATUS_WORST_RANK[a] >= STATUS_WORST_RANK[b] ? a : b;
}

/** Compute a SKU's readiness for an event at this DC. */
function skuReadiness(
  sku: SKU,
  plan: SkuDcPlan,
  event: DemandEvent,
): EventReadiness['perSku'][number] {
  const lift = liftForSku(event, sku);
  // Window: from (event.weekIndex - 1) to event.weekIndex (inclusive). Capped to horizon.
  const N = plan.weeks.length;
  const wEnd = Math.min(N - 1, event.weekIndex);
  const wStart = Math.max(0, wEnd - 1);
  let required = 0;
  let projected = 0;
  for (let w = wStart; w <= wEnd; w++) {
    required += Math.round(plan.forecastCs[w] * lift);
    // Projected = opening inventory at that week + arrivals that week
    const arriving = plan.arrivals.reduce((s, r) => s + r.cases[w], 0);
    projected += plan.openingInventory[w] + arriving;
  }
  const gap = Math.max(0, required - projected);
  let status: SkuStatus;
  if (gap === 0)             status = 'healthy';
  else if (gap < required * 0.05) status = 'on_track';
  else if (gap < required * 0.20) status = 'at_risk';
  else                       status = 'critical';
  return { sku, required, projected, gap, status, lift };
}

export function buildEventReadiness(dcId: string, event: DemandEvent): EventReadiness {
  const plans = SKUS.map((sku) => ({ sku, plan: buildDefaultPlan(sku.id, dcId) }));
  const perSku = plans.map(({ sku, plan }) => skuReadiness(sku, plan, event));
  const overall = perSku.reduce<SkuStatus>((acc, s) => worse(acc, s.status), 'healthy');
  const exposureUsd = perSku.reduce((s, x) => s + x.gap * x.sku.casePackQty * x.sku.retailPrice, 0);
  return {
    event,
    overall,
    perSku,
    exposureUsd,
    decisionWeek: Math.max(0, event.weekIndex - event.recommendedLeadWeeks),
  };
}

export interface IncomingShipment {
  weekIndex: number;
  /** ISO date of week start. */
  weekStart: string;
  skuId: string;
  cases: number;
  fromSegment: string;
}

/** Aggregate shipments arriving at this DC over the next N weeks. */
export function buildIncoming(dcId: string, weeksAhead: number): IncomingShipment[] {
  const out: IncomingShipment[] = [];
  for (const sku of SKUS) {
    const plan = buildDefaultPlan(sku.id, dcId);
    for (let w = 0; w < Math.min(weeksAhead, plan.weeks.length); w++) {
      for (const row of plan.arrivals) {
        if (row.cases[w] > 0) {
          out.push({
            weekIndex: w,
            weekStart: plan.weeks[w].weekStart,
            skuId: sku.id,
            cases: row.cases[w],
            fromSegment: row.fromSegment,
          });
        }
      }
    }
  }
  out.sort((a, b) => a.weekIndex - b.weekIndex || b.cases - a.cases);
  return out;
}

export interface RecommendedAction {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  body: string;
  rationale: string;
  ctaPrimary: string;
  ctaSecondary?: string;
  deadline?: string; // human label like "by Mon May 4"
  metric?: { label: string; value: string };
}

/** Compose recommended actions from statuses + event readiness. */
export function buildActions(dcId: string): RecommendedAction[] {
  const actions: RecommendedAction[] = [];
  const dc = DC_BY_ID[dcId];
  const statuses = buildDcStatuses(dcId);

  // 1) Critical SKUs first
  for (const s of statuses.filter((x) => x.status === 'critical')) {
    actions.push({
      id: `crit-${s.skuId}`,
      priority: 'high',
      title: `${s.sku.emoji} ${s.sku.name} — escalate now`,
      body: `${dc.code} (${dc.city}, ${dc.state}) projected to stock out in week +${s.oosWeek}. Currently ${s.casesNow.toLocaleString()} cs · ${s.dohNow}d on hand at ${s.burnRate.toLocaleString()} cs/wk burn.`,
      rationale: 'Escalate to Bespoke ops to expedite the next inbound or open an emergency PO.',
      ctaPrimary: 'Escalate to Bespoke',
      ctaSecondary: 'Reallocate from another DC',
      metric: { label: 'Lost sales (12w)', value: usd(s.lostSales12wk) },
      deadline: 'today',
    });
  }

  // 2) At-risk events
  for (const ev of EVENTS) {
    if (ev.weekIndex <= 0) continue;
    const r = buildEventReadiness(dcId, ev);
    if (r.overall === 'critical' || r.overall === 'at_risk') {
      const worst = r.perSku.filter((p) => p.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 3);
      const lines = worst.map((w) => `${w.sku.name}: gap ${w.gap.toLocaleString()} cs`);
      actions.push({
        id: `event-${ev.id}`,
        priority: r.overall === 'critical' ? 'high' : 'medium',
        title: `${ev.emoji} ${ev.name} — ${r.overall === 'critical' ? 'at-risk for' : 'tight on'} ${worst.length} SKU${worst.length === 1 ? '' : 's'}`,
        body: `${ev.name} is ${ev.weekIndex} ${ev.weekIndex === 1 ? 'week' : 'weeks'} out (${ev.shortDescription}). Decision deadline week +${r.decisionWeek}.`,
        rationale: lines.join(' · '),
        ctaPrimary: 'Open event detail',
        ctaSecondary: 'Notify Bespoke',
        metric: { label: 'Exposure', value: usd(r.exposureUsd) },
        deadline: `wk +${r.decisionWeek}`,
      });
    }
  }

  // 3) Surplus / hold receiving (a healthy DC story for variety)
  const surplus = statuses
    .filter((x) => x.status === 'healthy' && x.dohNow > 28 && x.totalInbound > x.burnRate * 6)
    .slice(0, 1);
  for (const s of surplus) {
    actions.push({
      id: `surplus-${s.skuId}`,
      priority: 'low',
      title: `${s.sku.emoji} ${s.sku.name} — consider holding receiving`,
      body: `${s.dohNow}d on hand and ${s.totalInbound.toLocaleString()} cs more inbound across the horizon. Upstream surplus risks short-dated stock.`,
      rationale: 'Talk to Bespoke about pushing the next sailing 1–2 weeks later.',
      ctaPrimary: 'Notify Bespoke',
    });
  }

  // Order by priority then SKU emoji for stable order
  const pri: Record<RecommendedAction['priority'], number> = { high: 0, medium: 1, low: 2 };
  actions.sort((a, b) => pri[a.priority] - pri[b.priority]);
  return actions;
}

function usd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

/** Convenience: returns all upcoming events with their readiness for a DC. */
export function buildAllEventReadiness(dcId: string): EventReadiness[] {
  return ALL_EVENTS.map((ev) => buildEventReadiness(dcId, ev));
}
