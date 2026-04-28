import type { SegmentKey } from '../types';

export type DisruptionSeverity = 'info' | 'warning' | 'critical' | 'positive';

export interface DisruptionNote {
  id: string;
  segmentKey: SegmentKey;
  severity: DisruptionSeverity;
  title: string;
  body: string;
  /** ISO date the note was last updated. */
  updated: string;
  /** Optional impact summary for the demo (e.g. "+3 days transit"). */
  impact?: string;
}

/** Preset disruption / context notes pinned to specific pipeline nodes.
 *  These are illustrative — in production they'd come from operator input,
 *  carrier data feeds, or freight forwarder integrations. */
export const DISRUPTIONS: DisruptionNote[] = [
  {
    id: 'note-greek-easter',
    segmentKey: 'production',
    severity: 'warning',
    title: 'Eon factory holiday — Greek Easter',
    body: 'Production paused Apr 17–20 for Greek Orthodox Easter. Resumed Apr 21. Backlog cleared by Apr 26.',
    updated: '2026-04-22',
    impact: '−2 days production',
  },
  {
    id: 'note-rotterdam-strike',
    segmentKey: 'origin_port',
    severity: 'critical',
    title: 'Rotterdam dockworker strike',
    body: 'Selective walkout at ECT terminals through Apr 30. Two of our containers re-routed via Antwerp. Watching closely.',
    updated: '2026-04-26',
    impact: '+4 days transit on V-87',
  },
  {
    id: 'note-ocean-weather',
    segmentKey: 'ocean',
    severity: 'warning',
    title: 'North Atlantic weather window',
    body: 'MSC Helvetia rerouted 250nm south to avoid storm system. Updated ETA at Newark: May 7 (was May 4).',
    updated: '2026-04-25',
    impact: '+3 days ETA',
  },
  {
    id: 'note-newark-customs',
    segmentKey: 'us_port',
    severity: 'positive',
    title: 'Customs hold cleared',
    body: 'Random inspection on Apr 21 added 48 hours. Released Apr 24 — Better Goods Hazelnut Crunch on the truck.',
    updated: '2026-04-24',
    impact: 'recovered',
  },
  {
    id: 'note-3pl-routine',
    segmentKey: 'bespoke_wh',
    severity: 'info',
    title: 'Bespoke 3PL — operating normally',
    body: '~10 days of safety stock against weekly McLane PO cadence. No anomalies.',
    updated: '2026-04-26',
  },
  {
    id: 'note-mclane-memorial',
    segmentKey: 'mclane_dc',
    severity: 'warning',
    title: 'Memorial Day staffing',
    body: 'McLane SE region operating at 80% headcount May 25–27. Expect dwell time +1 day across Brookhaven, Searcy, Hope Mills.',
    updated: '2026-04-26',
    impact: '+1 day McLane dwell, SE',
  },
  {
    id: 'note-store-mothers-day',
    segmentKey: 'walmart_store',
    severity: 'info',
    title: 'Mother\'s Day endcap planning',
    body: 'May 1–9 endcap placement on Better Goods Dark 70% and Sea Salt Caramel — expect +50–60% lift. Confirmed with Walmart category team.',
    updated: '2026-04-23',
  },
];

export function disruptionsForNode(segmentKeys: SegmentKey[]): DisruptionNote[] {
  return DISRUPTIONS.filter((d) => segmentKeys.includes(d.segmentKey));
}
