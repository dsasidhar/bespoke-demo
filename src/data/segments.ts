import type { Segment, SegmentKey } from '../types';

/** Pilot segments. The flow for Walmart Better Goods private label is:
 *  Greek/Swiss factory → Rotterdam port → ocean (~15d) → Newark port → Newark 3PL (Bespoke WH)
 *  → McLane DC (~2d pass-through) → Walmart store back room → Walmart shelf.
 *  No separate "Walmart DC" — private label is shipped directly to store back rooms. */
export const SEGMENTS: Segment[] = [
  { key: 'production',          name: 'Scheduled for production',           short: 'Production',     group: 'origin',       dwellDays: 14, ownedBy: 'Manufacturer' },
  { key: 'origin_truck',        name: 'Factory → Rotterdam',                short: 'Origin truck',   group: 'origin',       dwellDays: 2,  ownedBy: 'Carrier' },
  { key: 'origin_port',         name: 'At Rotterdam port',                  short: 'Rotterdam',      group: 'transit_in',   dwellDays: 4,  ownedBy: 'Carrier' },
  { key: 'ocean',               name: 'Ocean — Rotterdam → Newark',         short: 'Ocean',          group: 'transit_in',   dwellDays: 15, ownedBy: 'Carrier' },
  { key: 'us_port',             name: 'At Newark port + US customs',        short: 'Newark port',    group: 'transit_in',   dwellDays: 3,  ownedBy: 'Carrier' },
  { key: 'us_truck',            name: 'Newark port → Bespoke 3PL',          short: 'Port → 3PL',     group: 'transit_in',   dwellDays: 1,  ownedBy: 'Carrier' },
  { key: 'bespoke_wh',          name: 'Bespoke 3PL · Newark NJ',            short: 'Bespoke 3PL',    group: 'bespoke',      dwellDays: 10, ownedBy: 'Bespoke' },
  { key: 'wh_to_distributor',   name: '3PL → McLane',                       short: '3PL → McLane',   group: 'distributor',  dwellDays: 5,  ownedBy: 'Carrier' },
  { key: 'mclane_dc',           name: 'McLane DC (pass-through)',           short: 'McLane',         group: 'distributor',  dwellDays: 2,  ownedBy: 'McLane' },
  { key: 'mclane_to_retailer',  name: 'McLane → Walmart store',             short: 'McLane → store', group: 'retailer',     dwellDays: 2,  ownedBy: 'McLane' },
  { key: 'walmart_dc',          name: 'Walmart store back room',            short: 'Back room',      group: 'retailer',     dwellDays: 3,  ownedBy: 'Walmart' },
  { key: 'retailer_to_store',   name: 'Back room → shelf',                  short: 'To shelf',       group: 'retailer',     dwellDays: 1,  ownedBy: 'Walmart' },
  { key: 'walmart_store',       name: 'On shelf',                           short: 'On shelf',       group: 'retailer',     dwellDays: 5,  ownedBy: 'Walmart' },
];

export const SEGMENT_BY_KEY: Record<SegmentKey, Segment> = Object.fromEntries(
  SEGMENTS.map((s) => [s.key, s])
) as Record<SegmentKey, Segment>;

/** Major flow groups for the top-level ribbon visualization. */
export const FLOW_GROUPS = [
  { key: 'origin',      label: 'Producer',    color: '#502f1f' },
  { key: 'transit_in',  label: 'In transit',  color: '#8b5836' },
  { key: 'bespoke',     label: 'Bespoke 3PL', color: '#a87044' },
  { key: 'distributor', label: 'McLane',      color: '#3a4256' },
  { key: 'retailer',    label: 'Walmart',     color: '#0c111d' },
] as const;

export type FlowGroupKey = typeof FLOW_GROUPS[number]['key'];
