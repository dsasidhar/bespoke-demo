import { useMemo, useState } from 'react';
import TopBar from '../components/d1/TopBar';
import DcHeader from '../components/d5/DcHeader';
import SkuStatusCards from '../components/d5/SkuStatusCards';
import EventTimeline from '../components/d5/EventTimeline';
import EventDetail from '../components/d5/EventDetail';
import IncomingShipments from '../components/d5/IncomingShipments';
import ActionStack from '../components/d5/ActionStack';
import { DC_BY_ID } from '../data/dcs';
import {
  buildDcStatuses, buildAllEventReadiness, buildIncoming, buildActions,
} from '../data/dcOps';

const SNAPSHOT_LABEL = 'Apr 27, 2026';
const HORIZON_WEEKS = 12;

export default function DcPulse() {
  const [dcId, setDcId] = useState('dc-6020'); // default to the headline-story DC
  const dc = DC_BY_ID[dcId];

  const statuses = useMemo(() => buildDcStatuses(dcId), [dcId]);
  const readinesses = useMemo(() => buildAllEventReadiness(dcId), [dcId]);
  const incoming = useMemo(() => buildIncoming(dcId, 4), [dcId]);
  const actions = useMemo(() => buildActions(dcId), [dcId]);

  // Default selection: first in-horizon event
  const inHorizon = readinesses.filter((r) => r.event.weekIndex >= 0 && r.event.weekIndex <= HORIZON_WEEKS);
  const [selectedEventId, setSelectedEventId] = useState<string>(inHorizon[0]?.event.id ?? '');
  const selectedReadiness =
    readinesses.find((r) => r.event.id === selectedEventId) ?? inHorizon[0] ?? readinesses[0];

  const liveStats = useMemo(() => ({
    healthy:  statuses.filter((s) => s.status === 'healthy').length,
    at_risk:  statuses.filter((s) => s.status === 'at_risk').length,
    critical: statuses.filter((s) => s.status === 'critical').length,
    totalSkus: statuses.length,
  }), [statuses]);

  return (
    <div className="min-h-screen flex flex-col bg-ink-50">
      <TopBar snapshotDate={SNAPSHOT_LABEL} />

      <main className="flex-1 px-5 lg:px-8 py-6 max-w-[1500px] w-full mx-auto space-y-6">
        <DcHeader dc={dc} setDcId={setDcId} liveStats={liveStats} />

        <SkuStatusCards statuses={statuses} />

        <EventTimeline
          readinesses={readinesses}
          selectedEventId={selectedEventId}
          onSelect={setSelectedEventId}
          horizonWeeks={HORIZON_WEEKS}
        />

        {selectedReadiness && <EventDetail r={selectedReadiness} />}

        <IncomingShipments incoming={incoming} />

        <ActionStack actions={actions} />

        <footer className="pt-8 mt-4 border-t border-ink-100 text-xs text-ink-400 flex justify-between flex-wrap gap-2">
          <span>Bespoke × Walmart pilot · DC Pulse · all data illustrative</span>
        </footer>
      </main>
    </div>
  );
}
