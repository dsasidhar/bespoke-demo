import type { ArrivalRow, SegmentKey, SkuDcPlan, WeeklyBucket } from '../types';
import { SKU_BY_ID } from './skus';
import { DC_BY_ID } from './dcs';
import { clamp, makeRng, rngBetween, rngInt } from './rng';

/** Snapshot "today" used by the prototype. Friday, April 24, 2026 (the call day). */
export const SNAPSHOT_DATE = new Date('2026-04-27T00:00:00Z'); // Monday after intro call

const WEEKS = 12;

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildWeeks(start: Date = SNAPSHOT_DATE, count: number = WEEKS): WeeklyBucket[] {
  const out: WeeklyBucket[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i * 7);
    out.push({ weekStart: fmtDate(d), weekIndex: i });
  }
  return out;
}

/** Segments that contribute in-flight inventory toward a DC's future arrivals. */
const ARRIVAL_SEGMENTS: SegmentKey[] = [
  'production',
  'origin_truck',
  'origin_port',
  'ocean',
  'us_port',
  'us_truck',
  'bespoke_wh',
  'wh_to_distributor',
  'mclane_dc',
  'mclane_to_retailer',
];

/** Approximate weeks from now when this segment will reach the DC. */
const SEGMENT_ETA_WEEKS: Record<SegmentKey, number> = {
  production: 10,
  origin_truck: 9,
  origin_port: 8,
  ocean: 6,
  us_port: 5,
  us_truck: 4,
  bespoke_wh: 3,
  wh_to_distributor: 2,
  mclane_dc: 1,
  mclane_to_retailer: 0,
  walmart_dc: 0,
  retailer_to_store: 0,
  walmart_store: 0,
};

export interface PlanScenario {
  /** Force an out-of-stock dip in week range (lo,hi) for the demo story. */
  oosWeekRange?: [number, number];
}

export function buildSkuDcPlan(skuId: string, dcId: string, scenario: PlanScenario = {}): SkuDcPlan {
  const sku = SKU_BY_ID[skuId];
  const dc = DC_BY_ID[dcId];
  if (!sku || !dc) throw new Error(`Unknown sku/dc: ${skuId}/${dcId}`);
  const seed = `${skuId}|${dcId}`;
  const rng = makeRng(seed);
  const weeks = buildWeeks();

  // Forecast: base demand for this DC * SKU velocity factor
  const skuVelocity =
    sku.category === 'Chocolate Bar' ? rngBetween(rng, 0.85, 1.25)
      : sku.category === 'Premium Truffle' ? rngBetween(rng, 0.45, 0.7)
      : sku.category === 'Gummy' ? rngBetween(rng, 0.5, 0.9)
      : 0.6;
  const baseForecast = Math.round((dc.weeklyDemandCases / 10) * skuVelocity / 50) * 50; // round to 50
  const forecastCs = weeks.map(() => baseForecast);

  // Past actual demand (last 4 weeks fictional, kept for context)
  const actualDemandCs: (number | null)[] = weeks.map(() => null);

  // Opening inventory: starts somewhere realistic
  let openingInv: number;
  const isStoryDC = scenario.oosWeekRange != null;
  if (isStoryDC) {
    openingInv = Math.round(baseForecast * rngBetween(rng, 1.4, 1.8));
  } else {
    openingInv = Math.round(baseForecast * rngBetween(rng, 1.6, 3.5));
  }

  // Build arrivals matrix — rows = origin segment, cols = arrival week
  const arrivals: ArrivalRow[] = ARRIVAL_SEGMENTS.map((seg) => {
    const eta = SEGMENT_ETA_WEEKS[seg];
    const cases = new Array(WEEKS).fill(0);
    if (eta < WEEKS) {
      // base shipment qty rounded to typical case multiples
      let qty = Math.round(baseForecast * rngBetween(rng, 0.85, 1.15) / 100) * 100;
      // Story scenario: deliberately delay/skip the shipment that should land in OOS window
      if (isStoryDC && scenario.oosWeekRange) {
        const [lo, hi] = scenario.oosWeekRange;
        if (eta >= lo && eta <= hi) qty = 0; // missed shipment = OOS
      }
      cases[eta] = qty;
    }
    return { fromSegment: seg, cases };
  });

  // Walk inventory week by week
  const openingInventory: number[] = [];
  const daysOnHand: number[] = [];
  const expectedServiceLevel: number[] = [];
  const probSlBelow: SkuDcPlan['probSlBelow'] = { '1.0': [], '0.95': [], '0.9': [] };
  const recommendedOrders: number[] = [];
  const unableToShip: number[] = [];
  const shortDated: number[] = [];
  const expectedLostSales$: number[] = [];

  let inv = openingInv;
  for (let w = 0; w < WEEKS; w++) {
    openingInventory.push(inv);
    const arrivingThisWeek = arrivals.reduce((s, r) => s + r.cases[w], 0);
    const consumed = forecastCs[w];
    const available = inv + arrivingThisWeek;
    const closing = available - consumed;

    const doh = consumed > 0 ? (available / consumed) * 7 : 14;
    daysOnHand.push(Math.round(doh * 10) / 10);

    // Expected service level: based on weekly cover ratio
    const cover = available / consumed;
    let sl = 1.0;
    if (cover < 1) sl = clamp(cover * 0.85 + 0.1, 0.45, 0.95);
    else if (cover < 1.05) sl = 0.95;
    else if (cover < 1.15) sl = 0.985;
    expectedServiceLevel.push(Math.round(sl * 1000) / 1000);

    // Probability SL falls below thresholds
    const slack = clamp(cover - 1, -0.5, 1);
    const base100 = clamp(0.5 - slack * 0.6 + w * 0.015, 0.02, 0.85);
    const base95 = clamp(0.35 - slack * 0.55 + w * 0.012, 0.01, 0.7);
    const base90 = clamp(0.18 - slack * 0.5 + w * 0.01, 0.005, 0.55);
    probSlBelow['1.0'].push(Math.round(base100 * 100) / 100);
    probSlBelow['0.95'].push(Math.round(base95 * 100) / 100);
    probSlBelow['0.9'].push(Math.round(base90 * 100) / 100);

    // Recommended order: simple reorder when DOH falls under 21
    let rec = 0;
    if (doh < 21 && cover < 1.4 && w >= 1 && w <= 9) {
      rec = Math.round(forecastCs[w] * 1.2 / 100) * 100;
    }
    recommendedOrders.push(rec);

    // Unable to ship: when closing inv goes negative
    const uts = closing < 0 ? Math.min(-closing, consumed) : 0;
    unableToShip.push(uts);

    // Short-dated: small random for chocolate (shelf-life ~ 12mo with 4mo buffer)
    const sd = w >= 8 ? rngInt(rng, 0, Math.round(consumed * 0.05)) : 0;
    shortDated.push(sd);

    // Expected lost sales $ = unmet demand * unit cost * case-units
    const lost = uts * sku.casePackQty * sku.retailPrice;
    expectedLostSales$.push(Math.round(lost));

    inv = Math.max(0, closing);
  }

  return {
    skuId, dcId, weeks,
    forecastCs, actualDemandCs,
    daysOnHand, expectedServiceLevel, probSlBelow,
    openingInventory, arrivals,
    recommendedOrders, unableToShip, shortDated, expectedLostSales$,
  };
}

/** Plans the demo features by default — ensures a story of OOS at the "Cleburne, TX" DC for Swiss Dark 70%. */
export function buildDefaultPlan(skuId: string, dcId: string): SkuDcPlan {
  const storyKey = 'sku-001|dc-6020'; // Swiss Dark 70% × Cleburne TX = headline OOS story
  const scenario = `${skuId}|${dcId}` === storyKey
    ? { oosWeekRange: [3, 5] as [number, number] }
    : (Math.abs(hash(`${skuId}|${dcId}`)) % 7 === 0)
      ? { oosWeekRange: [rngIndex(skuId + dcId, 2, 8), rngIndex(skuId + dcId, 4, 10)] as [number, number] }
      : {};
  return buildSkuDcPlan(skuId, dcId, scenario);
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
function rngIndex(s: string, lo: number, hi: number): number {
  const r = makeRng(s)();
  return Math.min(hi, Math.max(lo, Math.floor(lo + r * (hi - lo))));
}
