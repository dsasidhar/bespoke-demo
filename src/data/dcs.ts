import type { DC } from '../types';

/** 12 representative McLane DCs displayed in the UI; the full network is 27 DCs.
 *  Real Walmart-servicing McLane DC codes used. */
export const DCS: DC[] = [
  { id: 'dc-6094', code: 'DC 6094', city: 'Bentonville',  state: 'AR', region: 'SW', weeklyDemandCases: 4500 },
  { id: 'dc-6038', code: 'DC 6038', city: 'Brookhaven',   state: 'MS', region: 'SE', weeklyDemandCases: 3800 },
  { id: 'dc-6020', code: 'DC 6020', city: 'Cleburne',     state: 'TX', region: 'SW', weeklyDemandCases: 5200 },
  { id: 'dc-6080', code: 'DC 6080', city: 'Buckeye',      state: 'AZ', region: 'W',  weeklyDemandCases: 3400 },
  { id: 'dc-6017', code: 'DC 6017', city: 'Pauls Valley', state: 'OK', region: 'SW', weeklyDemandCases: 2800 },
  { id: 'dc-6097', code: 'DC 6097', city: 'Marcy',        state: 'NY', region: 'NE', weeklyDemandCases: 4900 },
  { id: 'dc-6011', code: 'DC 6011', city: 'Searcy',       state: 'AR', region: 'SE', weeklyDemandCases: 3100 },
  { id: 'dc-6022', code: 'DC 6022', city: 'Loveland',     state: 'CO', region: 'W',  weeklyDemandCases: 2900 },
  { id: 'dc-6035', code: 'DC 6035', city: 'Sterling',     state: 'IL', region: 'MW', weeklyDemandCases: 5800 },
  { id: 'dc-6056', code: 'DC 6056', city: 'Tomah',        state: 'WI', region: 'MW', weeklyDemandCases: 3300 },
  { id: 'dc-6042', code: 'DC 6042', city: 'Plainfield',   state: 'IN', region: 'MW', weeklyDemandCases: 4200 },
  { id: 'dc-6071', code: 'DC 6071', city: 'Hope Mills',   state: 'NC', region: 'SE', weeklyDemandCases: 4600 },
];

export const DC_BY_ID: Record<string, DC> = Object.fromEntries(DCS.map((d) => [d.id, d]));

export const NETWORK = {
  totalMcLaneDCs: 27,
  totalWalmartStores: 4_000,
  representativeDcsShown: DCS.length,
  storesPerDcAvg: 150,
} as const;
