import { DCS } from './dcs';
import type { DC } from '../types';

export type RegionKey = 'NE' | 'SE' | 'MW' | 'SW' | 'W';

export interface Region {
  key: RegionKey;
  label: string;
  color: string;
  /** Approx number of Walmart stores serviced by McLane DCs in this region. */
  storeCount: number;
  /** Total number of McLane DCs in this region across the full 27-DC network. */
  totalDCs: number;
}

export const REGIONS: Region[] = [
  { key: 'NE', label: 'Northeast',  color: '#3a4256', storeCount: 740,  totalDCs: 4 },
  { key: 'SE', label: 'Southeast',  color: '#8b5836', storeCount: 1080, totalDCs: 7 },
  { key: 'MW', label: 'Midwest',    color: '#a87044', storeCount: 920,  totalDCs: 6 },
  { key: 'SW', label: 'Southwest',  color: '#c08c5d', storeCount: 760,  totalDCs: 6 },
  { key: 'W',  label: 'West',       color: '#525a6c', storeCount: 500,  totalDCs: 4 },
];

export const REGION_BY_KEY: Record<RegionKey, Region> = Object.fromEntries(
  REGIONS.map((r) => [r.key, r]),
) as Record<RegionKey, Region>;

export function dcsInRegion(region: RegionKey): DC[] {
  return DCS.filter((d) => d.region === region);
}
