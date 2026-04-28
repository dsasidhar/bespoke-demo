import type { SKU } from '../types';
import { SNAPSHOT_DATE } from './inventory';

export type EventCategory = 'Chocolate Bar' | 'Premium Truffle' | 'Gummy' | 'Seasonal';

export interface CategoryLift {
  category: EventCategory;
  lift: number; // demand multiplier vs. baseline weekly forecast
}

export interface DemandEvent {
  id: string;
  name: string;
  /** ISO date YYYY-MM-DD */
  date: string;
  /** How many *full* weeks ahead of the snapshot the event lands in (0 = this week). */
  weekIndex: number;
  emoji: string;
  shortDescription: string;
  longDescription: string;
  categoryLifts: CategoryLift[];
  /** Order-by date to plan ahead — lead time before event. */
  recommendedLeadWeeks: number;
}

function weeksBetween(target: string): number {
  const d = new Date(target + 'T00:00:00Z');
  const ms = d.getTime() - SNAPSHOT_DATE.getTime();
  return Math.round(ms / (7 * 24 * 60 * 60 * 1000));
}

const RAW: Omit<DemandEvent, 'weekIndex'>[] = [
  {
    id: 'mothers-day-2026',
    name: "Mother's Day",
    date: '2026-05-10',
    emoji: '💐',
    shortDescription: '+50% chocolate, +60% premium truffle',
    longDescription: 'Walmart historically sees a 50–60% lift on premium chocolate gifting in the 7-day window before Mother\'s Day. Spike concentrates on Saturday May 9.',
    categoryLifts: [
      { category: 'Chocolate Bar',   lift: 1.5 },
      { category: 'Premium Truffle', lift: 1.6 },
    ],
    recommendedLeadWeeks: 4,
  },
  {
    id: 'memorial-day-2026',
    name: 'Memorial Day',
    date: '2026-05-25',
    emoji: '🇺🇸',
    shortDescription: '+30% gummy (cookouts)',
    longDescription: 'Outdoor cookout demand drives gummy candy. Chocolate sees a small lift but melts on hot patios — typically a soft chocolate week.',
    categoryLifts: [
      { category: 'Gummy', lift: 1.3 },
    ],
    recommendedLeadWeeks: 3,
  },
  {
    id: 'fathers-day-2026',
    name: "Father's Day",
    date: '2026-06-21',
    emoji: '👔',
    shortDescription: '+35% premium truffle, +20% chocolate bar',
    longDescription: 'Premium chocolate gifting category. Smaller lift than Mother\'s Day but premium SKUs over-index.',
    categoryLifts: [
      { category: 'Chocolate Bar',   lift: 1.2 },
      { category: 'Premium Truffle', lift: 1.35 },
    ],
    recommendedLeadWeeks: 4,
  },
  {
    id: 'july4-2026',
    name: '4th of July',
    date: '2026-07-04',
    emoji: '🎆',
    shortDescription: '+40% gummy, flat chocolate',
    longDescription: 'Big gummy week. Walmart pulls candy aisle endcaps. Plan inventory 3 weeks ahead given the long weekend.',
    categoryLifts: [
      { category: 'Gummy', lift: 1.4 },
    ],
    recommendedLeadWeeks: 3,
  },
];

/** Out-of-horizon events shown for awareness, not yet plannable. */
const OUT_OF_HORIZON: Omit<DemandEvent, 'weekIndex'>[] = [
  {
    id: 'halloween-2026',
    name: 'Halloween',
    date: '2026-10-31',
    emoji: '🎃',
    shortDescription: '+80% gummy, +40% chocolate',
    longDescription: 'Single biggest candy event of the year. Plan POs by August.',
    categoryLifts: [
      { category: 'Gummy', lift: 1.8 },
      { category: 'Chocolate Bar', lift: 1.4 },
    ],
    recommendedLeadWeeks: 12,
  },
  {
    id: 'christmas-2026',
    name: 'Christmas',
    date: '2026-12-25',
    emoji: '🎄',
    shortDescription: '+90% chocolate, +120% premium truffle',
    longDescription: 'Highest-margin event for chocolate. Production capacity in Switzerland is the bottleneck — POs needed 16+ weeks out.',
    categoryLifts: [
      { category: 'Chocolate Bar',   lift: 1.9 },
      { category: 'Premium Truffle', lift: 2.2 },
      { category: 'Seasonal',        lift: 2.0 },
    ],
    recommendedLeadWeeks: 16,
  },
];

export const EVENTS: DemandEvent[] = RAW.map((e) => ({ ...e, weekIndex: weeksBetween(e.date) }));
export const FUTURE_EVENTS: DemandEvent[] = OUT_OF_HORIZON.map((e) => ({ ...e, weekIndex: weeksBetween(e.date) }));

export const ALL_EVENTS: DemandEvent[] = [...EVENTS, ...FUTURE_EVENTS];

/** Return the demand multiplier this event applies to the given SKU (1 if no effect). */
export function liftForSku(event: DemandEvent, sku: SKU): number {
  const found = event.categoryLifts.find((c) => c.category === sku.category);
  return found ? found.lift : 1;
}
