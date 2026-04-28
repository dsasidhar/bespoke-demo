import { useMemo, useState } from 'react';
import TopBar from '../components/d1/TopBar';
import InventoryChart from '../components/d1/InventoryChart';
import WeeklyPlanning from '../components/d1/WeeklyPlanning';
import BrandHeader from '../components/v1/BrandHeader';
import PilotFilters from '../components/v1/PilotFilters';
import HeroKpis from '../components/v1/HeroKpis';
import BottleneckCard from '../components/v1/BottleneckCard';
import PilotRibbon from '../components/v1/PilotRibbon';
import SkuStatusStrip from '../components/v1/SkuStatusStrip';
import PilotHeatmap from '../components/v1/PilotHeatmap';
import WhatIfSimulator, { WHATIF_DEFAULT } from '../components/v1/WhatIfSimulator';
import type { WhatIfState } from '../components/v1/WhatIfSimulator';
import FocusInbox from '../components/v1/FocusInbox';
import { SKU_BY_ID } from '../data/skus';
import { DC_BY_ID, DCS } from '../data/dcs';
import { buildDefaultPlan } from '../data/inventory';
import { buildPipelineSnapshot } from '../data/aggregate';
import { buildDcStatuses } from '../data/dcOps';

const SNAPSHOT_LABEL = 'Apr 27, 2026';

export default function WalmartPilot() {
  // Default selection: the headline OOS story.
  const [skuId, setSkuId] = useState('sku-001');
  const [dcId, setDcId] = useState('dc-6020');
  const [compareLastWeek, setCompareLastWeek] = useState(false);
  const [whatIf, setWhatIf] = useState<WhatIfState>(WHATIF_DEFAULT);

  const sku = SKU_BY_ID[skuId];
  const dc = DC_BY_ID[dcId];

  const plan = useMemo(() => buildDefaultPlan(skuId, dcId), [skuId, dcId]);
  const pipeline = useMemo(() => buildPipelineSnapshot(), []);
  const skuStatuses = useMemo(() => buildDcStatuses(dcId), [dcId]);

  // Network aggregates
  const { networkCases, networkDOH, atRiskDcs, totalLost, pSlBelow95 } = useMemo(() => {
    let cases = 0, dohSum = 0, atRisk = 0, lost = 0, pSum = 0;
    for (const d of DCS) {
      const p = buildDefaultPlan(skuId, d.id);
      cases += p.openingInventory[0];
      dohSum += p.daysOnHand[0];
      lost += p.expectedLostSales$.reduce((s, v) => s + v, 0);
      pSum += p.probSlBelow['0.95'][3];
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

  // What-if scenario impact (very rough heuristics — wires the sliders to KPIs)
  const impact = useMemo(() => {
    const baselineLost = totalLost;
    const baselineSL = plan.expectedServiceLevel[0];
    const baselineAtRiskDcs = atRiskDcs;
    let scenarioLost = baselineLost;
    let scenarioSL = baselineSL;
    let scenarioAtRiskDcs = baselineAtRiskDcs;
    if (whatIf.mclaneExtraCases > 0) {
      const reductionRatio = Math.min(0.85, whatIf.mclaneExtraCases / 30000);
      scenarioLost *= 1 - reductionRatio;
      scenarioSL = Math.min(0.999, baselineSL + reductionRatio * 0.06);
      scenarioAtRiskDcs = Math.max(0, baselineAtRiskDcs - Math.round(reductionRatio * 4));
    }
    if (whatIf.expediteWeeks > 0) {
      const r = whatIf.expediteWeeks * 0.18;
      scenarioLost *= 1 - r;
      scenarioSL = Math.min(0.999, scenarioSL + r * 0.04);
      scenarioAtRiskDcs = Math.max(0, scenarioAtRiskDcs - whatIf.expediteWeeks);
    }
    if (whatIf.demandMultiplier !== 1) {
      const stress = whatIf.demandMultiplier - 1;
      scenarioLost *= 1 + stress * 1.2;
      scenarioSL = Math.max(0.5, scenarioSL - stress * 0.1);
      scenarioAtRiskDcs = Math.min(DCS.length, Math.max(0, scenarioAtRiskDcs + Math.round(stress * 6)));
    }
    return {
      baselineLost: Math.round(baselineLost),
      scenarioLost: Math.round(scenarioLost),
      baselineSL,
      scenarioSL,
      baselineAtRiskDcs,
      scenarioAtRiskDcs,
    };
  }, [whatIf, totalLost, plan, atRiskDcs]);

  const dcLabel = `${dc.code} · ${dc.city}, ${dc.state}`;

  return (
    <div className="min-h-screen flex flex-col bg-ink-50">
      <TopBar snapshotDate={SNAPSHOT_LABEL} />
      <main className="flex-1 px-5 lg:px-8 py-6 max-w-[1500px] w-full mx-auto space-y-5">
        <BrandHeader snapshotLabel={SNAPSHOT_LABEL} />

        <PilotFilters
          sku={sku}
          dc={dc}
          setSkuId={setSkuId}
          setDcId={setDcId}
          snapshotLabel={SNAPSHOT_LABEL}
          compareLastWeek={compareLastWeek}
          setCompareLastWeek={setCompareLastWeek}
        />

        <HeroKpis
          plan={plan}
          networkCases={networkCases}
          networkDOH={networkDOH}
          atRiskDcs={atRiskDcs}
          totalLost={totalLost}
          pSlBelow95={pSlBelow95}
          compareLastWeek={compareLastWeek}
        />

        <BottleneckCard />

        <PilotRibbon snapshot={pipeline} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5">
            <SkuStatusStrip statuses={skuStatuses} selectedId={skuId} onSelect={setSkuId} />
          </div>
          <div className="lg:col-span-7">
            <InventoryChart plan={plan} skuName={sku.name} dcLabel={dcLabel} />
          </div>
        </div>

        <WeeklyPlanning plan={plan} skuName={sku.name} dcLabel={dcLabel} />

        <PilotHeatmap
          skuId={skuId}
          skuName={sku.name}
          mclaneOverrideCases={whatIf.mclaneExtraCases}
        />

        <WhatIfSimulator state={whatIf} setState={setWhatIf} impact={impact} />

        <FocusInbox />

        <footer className="pt-8 mt-4 border-t border-ink-100 text-xs text-ink-400 flex justify-between flex-wrap gap-2">
          <span>Bespoke × Walmart Better Goods · v0 Pilot · all data illustrative until NetSuite + McLane feeds connected</span>
        </footer>
      </main>
    </div>
  );
}
