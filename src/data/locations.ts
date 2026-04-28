import { DCS } from './dcs';

export type LocCategory = 'factory' | 'origin_port' | 'us_port' | 'bespoke_wh' | 'mclane_dc' | 'walmart_dc';

export interface Location {
  id: string;
  name: string;
  city: string;
  country: string;
  /** [lng, lat] — d3-geo / GeoJSON convention */
  coords: [number, number];
  category: LocCategory;
}

/** Static origin / hub locations. */
export const HUBS: Location[] = [
  { id: 'fac-luzern',   name: 'Bespoke Producer · Luzern',   city: 'Luzern',     country: 'Switzerland', coords: [8.3093, 47.0502],  category: 'factory' },
  { id: 'fac-zurich',   name: 'Co-packer · Zurich',          city: 'Zurich',     country: 'Switzerland', coords: [8.5417, 47.3769],  category: 'factory' },
  { id: 'port-genoa',   name: 'Genoa origin port',           city: 'Genoa',      country: 'Italy',       coords: [8.9463, 44.4056],  category: 'origin_port' },
  { id: 'port-rotterdam', name: 'Rotterdam origin port',     city: 'Rotterdam',  country: 'Netherlands', coords: [4.4777, 51.9244],  category: 'origin_port' },
  { id: 'port-longbeach', name: 'Long Beach US port',        city: 'Long Beach', country: 'USA',         coords: [-118.1937, 33.7701], category: 'us_port' },
  { id: 'port-houston',   name: 'Houston US port',           city: 'Houston',    country: 'USA',         coords: [-95.3698, 29.7604], category: 'us_port' },
  { id: 'port-newark',    name: 'Newark US port',            city: 'Newark',     country: 'USA',         coords: [-74.1745, 40.7357], category: 'us_port' },
  { id: 'wh-bentonville', name: 'Bespoke WH · Bentonville',  city: 'Bentonville',country: 'USA',         coords: [-94.2088, 36.3729], category: 'bespoke_wh' },
  { id: 'mc-temple',      name: 'McLane HQ · Temple',        city: 'Temple',     country: 'USA',         coords: [-97.3677, 31.0982], category: 'mclane_dc' },
  { id: 'mc-fortworth',   name: 'McLane DC · Fort Worth',    city: 'Fort Worth', country: 'USA',         coords: [-97.3308, 32.7555], category: 'mclane_dc' },
  { id: 'mc-northeast',   name: 'McLane DC · Carlisle',      city: 'Carlisle',   country: 'USA',         coords: [-77.1956, 40.2014], category: 'mclane_dc' },
];

export const HUB_BY_ID: Record<string, Location> = Object.fromEntries(HUBS.map((h) => [h.id, h]));

/** Approximate lat/lng for each Walmart DC. Built from dcs.ts cities. */
const DC_COORDS: Record<string, [number, number]> = {
  'dc-6094': [-94.2088, 36.3729], // Bentonville, AR
  'dc-6038': [-90.4407, 31.5793], // Brookhaven, MS
  'dc-6020': [-97.3868, 32.3475], // Cleburne, TX
  'dc-6080': [-112.5837, 33.3703], // Buckeye, AZ
  'dc-6017': [-97.2225, 34.7393], // Pauls Valley, OK
  'dc-6097': [-75.2616, 43.1733], // Marcy, NY
  'dc-6011': [-91.7362, 35.2506], // Searcy, AR
  'dc-6022': [-105.0744, 40.3978], // Loveland, CO
  'dc-6035': [-89.6962, 41.7886], // Sterling, IL
  'dc-6056': [-90.5040, 43.9844], // Tomah, WI
  'dc-6042': [-86.3997, 39.7042], // Plainfield, IN
  'dc-6071': [-78.9678, 34.9641], // Hope Mills, NC
};

export const WALMART_DC_LOCS: Location[] = DCS.map((dc) => ({
  id: dc.id,
  name: `${dc.code} · ${dc.city}`,
  city: dc.city,
  country: 'USA',
  coords: DC_COORDS[dc.id],
  category: 'walmart_dc',
}));

export const ALL_LOCATIONS: Location[] = [...HUBS, ...WALMART_DC_LOCS];
export const LOC_BY_ID: Record<string, Location> = Object.fromEntries(ALL_LOCATIONS.map((l) => [l.id, l]));
