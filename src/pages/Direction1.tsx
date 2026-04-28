import { useMemo, useState } from 'react';
import TopBar from '../components/d1/TopBar';
import SideNav from '../components/d1/SideNav';
import Filters from '../components/d1/Filters';
import KpiCards from '../components/d1/KpiCards';
import PipelineRibbon from '../components/d1/PipelineRibbon';
import WeeklyPlanning from '../components/d1/WeeklyPlanning';
import AggregateHeatmap from '../components/d1/AggregateHeatmap';
import InsightsPanel from '../components/d1/InsightsPanel';
import InventoryChart from '../components/d1/InventoryChart';
import { SKU_BY_ID } from '../data/skus';
import { DC_BY_ID, DCS } from '../data/dcs';
import { buildDefaultPlan } from '../data/inventory';
import { buildPipelineSnapshot } from '../data/aggregate';

const SNAPSHOT_LABEL = 'Apr 27, 2026';

export default function Direction1() {
  // Default to the headline story: Swiss Dark 70% × Cleburne, TX
  const [skuId, setSkuId] = useState('sku-001');
  const [dcId, setDcId] = useState('dc-6020');

  const sku = SKU_BY_ID[skuId];
  const dc = DC_BY_ID[dcId];

  const plan = useMemo(() => buildDefaultPlan(skuId, dcId), [skuId, dcId]);
  const pipeline = useMemo(() => buildPipelineSnapshot(), []);

  // Network-wide aggregates for KPIs
  const { networkCases, networkDOH, atRiskDcs, totalLost, pSlBelow95 } = useMemo(() => {
    let cases = 0, dohSum = 0, atRisk = 0, lost = 0, pSum = 0;
    for (const d of DCS) {
      const p = buildDefaultPlan(skuId, d.id);
      cases += p.openingInventory[0];
      dohSum += p.daysOnHand[0];
      lost += p.expectedLostSales$.reduce((s, v) => s + v, 0);
      pSum += p.probSlBelow['0.95'][3]; // 4-week-out p(<95%)
      const willStockout = p.openingInventory.slice(0, 6).some((v) => v <= 0);
      if (willStockout) atRisk++;
    }
    return {
      networkCases: cases,
      networkDOH: Math.round(dohSum / DCS.length),
      atRiskDcs: atRisk,
      totalLost: lost,
      pSlBelow95: Math.round((pSum / DCS.length) * 100),
    };
  }, [skuId]);

  const dcLabel = `${dc.code} · ${dc.city}, ${dc.state}`;

  return (
    <div className="min-h-screen flex flex-col bg-ink-50">
      <TopBar snapshotDate={SNAPSHOT_LABEL} />

      <div className="flex flex-1">
        <SideNav />

        <main className="flex-1 px-5 lg:px-8 py-6 max-w-[1500px] w-full mx-auto">
          <PageHeader sku={sku.name} dc={dcLabel} />

          <section className="mb-5">
            <Filters
              sku={sku}
              dc={dc}
              setSkuId={setSkuId}
              setDcId={setDcId}
              snapshotLabel={SNAPSHOT_LABEL}
            />
          </section>

          <section id="kpi" className="mb-5 scroll-mt-20">
            <KpiCards
              plan={plan}
              networkCases={networkCases}
              networkDOH={networkDOH}
              atRiskDcs={atRiskDcs}
              totalLost={totalLost}
              pSlBelow95={pSlBelow95}
            />
          </section>

          <section id="pipeline" className="mb-5 scroll-mt-20">
            <PipelineRibbon snapshot={pipeline} />
          </section>

          <section id="trajectory" className="mb-5 scroll-mt-20">
            <InventoryChart plan={plan} skuName={sku.name} dcLabel={dcLabel} />
          </section>

          <section id="planning" className="mb-5 scroll-mt-20">
            <WeeklyPlanning plan={plan} skuName={sku.name} dcLabel={dcLabel} />
          </section>

          <section id="network" className="mb-5 scroll-mt-20">
            <AggregateHeatmap skuId={skuId} skuName={sku.name} />
          </section>

          <section id="insights" className="mb-10 scroll-mt-20">
            <InsightsPanel />
          </section>

          <footer className="pt-8 mt-8 border-t border-ink-100 text-xs text-ink-400 flex justify-between flex-wrap gap-2">
            <span>Bespoke × Walmart pilot · v0 prototype · all data is illustrative</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

function PageHeader({ sku, dc }: { sku: string; dc: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 text-xs text-ink-500 mb-1">
        <span>Walmart program</span>
        <span>›</span>
        <span>SKU view</span>
        <span>›</span>
        <span className="text-ink-700 font-medium">{sku}</span>
      </div>
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{sku}</h1>
          <p className="text-sm text-ink-500">{dc} · 12-week forward visibility · 13 supply chain segments</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="pill bg-emerald-100 text-emerald-800">Live data feed simulated</span>
          <span className="pill bg-cocoa-100 text-cocoa-800">Shelf life: 12 mo · 4 mo min remaining</span>
        </div>
      </div>
    </div>
  );
}
