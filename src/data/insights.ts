import type { Insight } from '../types';

export const INSIGHTS: Insight[] = [
  {
    id: 'ins-1',
    severity: 'critical',
    title: 'Cleburne, TX (DC 6020) projected OOS in 4 weeks',
    body: 'Better Goods Dark 70% will run out the week of May 25. Last week the same DC was projected at 14 days on hand — a missed Apr 11 sailing out of Rotterdam (V-87, dockworker strike) pushed inventory off the plan.',
    metric: 'Days on hand',
    delta: '−14d vs. last snapshot',
    skuId: 'sku-001',
    dcId: 'dc-6020',
  },
  {
    id: 'ins-2',
    severity: 'warning',
    title: 'Hazelnut Crunch demand running 18% hotter than forecast',
    body: 'Past 4 weeks of Walmart POS show 4,120 cases/wk vs. forecast of 3,500. Recommend adjusting July PO upward by 2,400 cases — note 10-week lead time at Eon.',
    metric: 'Demand variance',
    delta: '+18% vs. forecast',
    skuId: 'sku-003',
  },
  {
    id: 'ins-3',
    severity: 'warning',
    title: 'Ocean transit times trending +3 days',
    body: 'Last 6 sailings averaged 18 days Rotterdam → Newark vs. baseline 15d. Pipeline ETAs auto-shifted by 3 days for all in-flight containers.',
    metric: 'Lead time',
    delta: '+3d',
  },
  {
    id: 'ins-4',
    severity: 'positive',
    title: 'Sea Salt Caramel pipeline healthy — opportunity to push',
    body: 'Inventory across all McLane DCs sits at 31 days on hand. Shelf life has 11+ months remaining. Safe to discuss the Mother\'s Day endcap with Clint at the May 5 review.',
    metric: 'Days on hand',
    delta: '+8d vs. plan',
    skuId: 'sku-004',
  },
  {
    id: 'ins-5',
    severity: 'info',
    title: 'P(SL < 95%) across the network: 14%',
    body: 'Highest exposure: SE region (Brookhaven, Hope Mills). Driven by McLane DC dwell extending +1 day during Memorial Day staffing (May 25–27).',
    metric: 'P(SL<95%)',
    delta: '+6 pts',
  },
];
