export type SegmentKey =
  | 'production'
  | 'origin_truck'
  | 'origin_port'
  | 'ocean'
  | 'us_port'
  | 'us_truck'
  | 'bespoke_wh'
  | 'wh_to_distributor'
  | 'mclane_dc'
  | 'mclane_to_retailer'
  | 'walmart_dc'
  | 'retailer_to_store'
  | 'walmart_store';

export interface Segment {
  key: SegmentKey;
  name: string;
  short: string;
  group: 'origin' | 'transit_in' | 'bespoke' | 'distributor' | 'retailer';
  /** Approx average dwell time in days, for simulation. */
  dwellDays: number;
  ownedBy: 'Manufacturer' | 'Carrier' | 'Bespoke' | 'McLane' | 'Walmart';
}

export interface SKU {
  id: string;
  code: string;
  name: string;
  brand: string;
  category: 'Chocolate Bar' | 'Premium Truffle' | 'Gummy' | 'Seasonal';
  packSize: string;
  casePackQty: number; // bars per case
  shelfLifeDays: number;
  minRemainingDaysAtDC: number; // contractual minimum
  unitCost: number; // $/case (cogs)
  retailPrice: number; // $/unit
  emoji: string;
}

export interface DC {
  id: string;
  code: string; // e.g. "DC 6094"
  city: string;
  state: string;
  region: 'NE' | 'SE' | 'MW' | 'SW' | 'W';
  weeklyDemandCases: number; // base demand
}

export interface WeeklyBucket {
  weekStart: string; // ISO YYYY-MM-DD (Monday)
  weekIndex: number; // 0 = current week
}

/** A single shipment's arrival forecast at a particular DC. */
export interface ArrivalRow {
  fromSegment: SegmentKey; // origin of this in-flight inventory
  cases: number[]; // index aligned to weeks (0..N-1)
}

export interface SkuDcPlan {
  skuId: string;
  dcId: string;
  weeks: WeeklyBucket[];
  forecastCs: number[];
  actualDemandCs: (number | null)[]; // null for future weeks
  daysOnHand: number[];
  expectedServiceLevel: number[]; // 0..1
  /** prob SL falls below threshold => threshold key 1.0/0.95/0.9 -> array per week */
  probSlBelow: { '1.0': number[]; '0.95': number[]; '0.9': number[] };
  openingInventory: number[]; // cases
  arrivals: ArrivalRow[]; // each row = one segment-bucket, columns = weeks
  recommendedOrders: number[]; // cases (0 if none)
  unableToShip: number[]; // cases (0 if none)
  shortDated: number[]; // cases that risk expiry
  expectedLostSales$: number[];
}

export interface SegmentSnapshot {
  segmentKey: SegmentKey;
  cases: number;
  shipments: number; // count of distinct in-flight loads
  earliestEtaWeek: number; // weeks from now
}

export interface Insight {
  id: string;
  severity: 'critical' | 'warning' | 'info' | 'positive';
  title: string;
  body: string;
  metric?: string;
  delta?: string;
  skuId?: string;
  dcId?: string;
}
