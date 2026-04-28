import type { SegmentKey } from '../types';
import { SEGMENTS } from './segments';
import { SKUS } from './skus';
import { DCS } from './dcs';
import { ALL_LOCATIONS, HUB_BY_ID, LOC_BY_ID } from './locations';
import type { Location } from './locations';
import { makeRng, rngBetween, rngInt } from './rng';

export type ShipmentStatus = 'on_time' | 'at_risk' | 'delayed';
export type Mode = 'sea' | 'air' | 'truck' | 'rail';

export interface Shipment {
  id: string;
  skuId: string;
  cases: number;
  mode: Mode;
  status: ShipmentStatus;
  /** Current chain segment. */
  segment: SegmentKey;
  /** Progress 0..1 within the current segment. */
  progress: number;
  /** Where this shipment originates (factory). */
  originId: string;
  /** Final destination (Walmart DC). */
  destinationId: string;
  /** The two endpoints of the *current* segment leg, used to interpolate live position. */
  legFrom: [number, number];
  legTo: [number, number];
  /** Live current position [lng, lat]. */
  position: [number, number];
  /** Vessel / carrier name for flavor. */
  carrier: string;
  vessel?: string;
  poNumber: string;
  etaWeeks: number; // weeks until landing at the destination DC
  /** Days delayed vs plan; 0 if on time. */
  delayDays: number;
  /** Friendly route summary like "Genoa → Long Beach → Bentonville → Cleburne, TX". */
  routeSummary: string[];
}

/** Vessel names — chosen so they look real but generic. */
const VESSELS = [
  'MV Helvetia', 'MV Alpine Star', 'MV Bernina', 'MV Matterhorn', 'MV Lucerne',
  'MV Cargo Atlas', 'MV Atlantic Crest', 'MV Stella Maris',
];
const TRUCK_CARRIERS = ['Schneider', 'JB Hunt', 'Werner', 'XPO', 'Knight'];

/** Map a segment to (legFrom, legTo) endpoints by hub IDs.
 *  Some legs depend on the destination DC (final-mile). */
function endpointsForSegment(segment: SegmentKey, destDcId: string): [Location, Location] {
  const factory = HUB_BY_ID['fac-luzern'];
  const originPort = HUB_BY_ID['port-genoa'];
  const usPort = HUB_BY_ID['port-longbeach'];
  const wh = HUB_BY_ID['wh-bentonville'];
  const mclane = HUB_BY_ID['mc-temple'];
  const dc = LOC_BY_ID[destDcId];
  switch (segment) {
    case 'production':         return [factory, factory];
    case 'origin_truck':       return [factory, originPort];
    case 'origin_port':        return [originPort, originPort];
    case 'ocean':              return [originPort, usPort];
    case 'us_port':            return [usPort, usPort];
    case 'us_truck':           return [usPort, wh];
    case 'bespoke_wh':         return [wh, wh];
    case 'wh_to_distributor':  return [wh, mclane];
    case 'mclane_dc':          return [mclane, mclane];
    case 'mclane_to_retailer': return [mclane, dc];
    case 'walmart_dc':         return [dc, dc];
    case 'retailer_to_store':  return [dc, dc];
    case 'walmart_store':      return [dc, dc];
  }
}

function interp(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function modeForSegment(segment: SegmentKey): Mode {
  if (segment === 'ocean') return 'sea';
  if (segment === 'production' || segment === 'origin_port' || segment === 'us_port' ||
      segment === 'bespoke_wh' || segment === 'mclane_dc' || segment === 'walmart_dc' ||
      segment === 'walmart_store') return 'truck';
  return 'truck';
}

function etaWeeksForSegment(segment: SegmentKey): number {
  // Mirrors SEGMENT_ETA_WEEKS in inventory.ts
  return ({
    production: 10, origin_truck: 9, origin_port: 8, ocean: 6, us_port: 5,
    us_truck: 4, bespoke_wh: 3, wh_to_distributor: 2, mclane_dc: 1,
    mclane_to_retailer: 0, walmart_dc: 0, retailer_to_store: 0, walmart_store: 0,
  } as Record<SegmentKey, number>)[segment];
}

const SEGMENTS_FOR_SIM: SegmentKey[] = [
  'production', 'origin_truck', 'origin_port', 'ocean', 'us_port', 'us_truck',
  'bespoke_wh', 'wh_to_distributor', 'mclane_dc',
];

/** Generate ~30 active shipments deterministically. */
export function buildShipments(): Shipment[] {
  const out: Shipment[] = [];
  let count = 0;
  const seedBase = 'shipments-v1';

  for (const skuI of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    const sku = SKUS[skuI];
    for (const segI of SEGMENTS_FOR_SIM.keys()) {
      const segment = SEGMENTS_FOR_SIM[segI];
      const rng = makeRng(`${seedBase}|${sku.id}|${segment}`);
      const dc = DCS[rngInt(rng, 0, DCS.length - 1)];
      const [legA, legB] = endpointsForSegment(segment, dc.id);
      const progress = rngBetween(rng, 0.05, 0.95);
      const position = interp(legA.coords, legB.coords, progress);
      const segObj = SEGMENTS.find((s) => s.key === segment)!;

      // Status: ~70% on time, 20% at risk, 10% delayed
      const r = rng();
      const status: ShipmentStatus = r < 0.7 ? 'on_time' : r < 0.9 ? 'at_risk' : 'delayed';
      const delayDays = status === 'delayed' ? rngInt(rng, 2, 6) : status === 'at_risk' ? rngInt(rng, 0, 2) : 0;
      const cases = Math.round(rngBetween(rng, 800, 5200) / 100) * 100;
      const mode = modeForSegment(segment);

      const carrier = mode === 'sea'
        ? VESSELS[rngInt(rng, 0, VESSELS.length - 1)]
        : TRUCK_CARRIERS[rngInt(rng, 0, TRUCK_CARRIERS.length - 1)];

      out.push({
        id: `SHP-${(1000 + count).toString()}`,
        skuId: sku.id,
        cases,
        mode,
        status,
        segment,
        progress,
        originId: 'fac-luzern',
        destinationId: dc.id,
        legFrom: legA.coords,
        legTo: legB.coords,
        position,
        carrier,
        vessel: mode === 'sea' ? carrier : undefined,
        poNumber: `PO-${rngInt(rng, 4500, 9999)}`,
        etaWeeks: etaWeeksForSegment(segment),
        delayDays,
        routeSummary: [
          'Luzern, CH',
          'Genoa',
          'Long Beach',
          'Bentonville WH',
          'McLane Temple',
          `${dc.city}, ${dc.state}`,
        ],
      });
      count++;

      // Skip "_" eslint, segObj only used for typing/future tooltips
      void segObj;
    }
  }
  return out;
}

/** Major route legs to draw permanently as guide arcs. */
export const ROUTE_LEGS: { from: [number, number]; to: [number, number]; kind: 'sea' | 'land' }[] = [
  { from: HUB_BY_ID['fac-luzern'].coords,    to: HUB_BY_ID['port-genoa'].coords,     kind: 'land' },
  { from: HUB_BY_ID['port-genoa'].coords,    to: HUB_BY_ID['port-longbeach'].coords, kind: 'sea' },
  { from: HUB_BY_ID['port-longbeach'].coords,to: HUB_BY_ID['wh-bentonville'].coords, kind: 'land' },
  { from: HUB_BY_ID['wh-bentonville'].coords,to: HUB_BY_ID['mc-temple'].coords,      kind: 'land' },
  // McLane → each Walmart DC
  ...ALL_LOCATIONS.filter((l) => l.category === 'walmart_dc').map((dc) => ({
    from: HUB_BY_ID['mc-temple'].coords as [number, number],
    to: dc.coords,
    kind: 'land' as const,
  })),
];
