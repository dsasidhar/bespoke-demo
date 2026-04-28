import type { SKU } from '../types';

/** 8-SKU pilot for Walmart Better Goods (premium private label).
 *  Sourced from Bespoke SA's Greek manufacturers (Eon for chocolate, Lavdas for confections)
 *  plus a Swiss supplier for one of the dark chocolate bars. */
export const SKUS: SKU[] = [
  {
    id: 'sku-001', code: 'BG-CHC-DK70', name: 'Better Goods Dark Chocolate 70%', brand: 'Better Goods',
    category: 'Chocolate Bar', packSize: '100g', casePackQty: 24,
    shelfLifeDays: 365, minRemainingDaysAtDC: 120, unitCost: 28.4, retailPrice: 2.98, emoji: '🍫',
  },
  {
    id: 'sku-002', code: 'BG-CHC-MK', name: 'Better Goods Milk Chocolate', brand: 'Better Goods',
    category: 'Chocolate Bar', packSize: '100g', casePackQty: 24,
    shelfLifeDays: 365, minRemainingDaysAtDC: 120, unitCost: 26.1, retailPrice: 2.78, emoji: '🍫',
  },
  {
    id: 'sku-003', code: 'BG-CHC-HZ', name: 'Better Goods Hazelnut Crunch', brand: 'Better Goods',
    category: 'Chocolate Bar', packSize: '100g', casePackQty: 24,
    shelfLifeDays: 365, minRemainingDaysAtDC: 120, unitCost: 30.2, retailPrice: 3.24, emoji: '🌰',
  },
  {
    id: 'sku-004', code: 'BG-CHC-SC', name: 'Better Goods Sea Salt Caramel', brand: 'Better Goods',
    category: 'Chocolate Bar', packSize: '100g', casePackQty: 24,
    shelfLifeDays: 365, minRemainingDaysAtDC: 120, unitCost: 31.6, retailPrice: 3.48, emoji: '🧂',
  },
  {
    id: 'sku-005', code: 'BG-CHC-AS', name: 'Better Goods Almond Sea Salt', brand: 'Better Goods',
    category: 'Chocolate Bar', packSize: '100g', casePackQty: 24,
    shelfLifeDays: 365, minRemainingDaysAtDC: 120, unitCost: 29.8, retailPrice: 3.18, emoji: '🥜',
  },
  {
    id: 'sku-006', code: 'BG-WAF-CH', name: 'Better Goods Chocolate Wafer Bites', brand: 'Better Goods',
    category: 'Chocolate Bar', packSize: '90g', casePackQty: 24,
    shelfLifeDays: 270, minRemainingDaysAtDC: 90, unitCost: 25.4, retailPrice: 2.68, emoji: '🍪',
  },
  {
    id: 'sku-007', code: 'BG-GMY-OR', name: 'Better Goods Gummy Bears', brand: 'Better Goods',
    category: 'Gummy', packSize: '200g', casePackQty: 18,
    shelfLifeDays: 540, minRemainingDaysAtDC: 180, unitCost: 19.8, retailPrice: 2.48, emoji: '🐻',
  },
  {
    id: 'sku-008', code: 'BG-GMY-SR', name: 'Better Goods Sour Gummy Worms', brand: 'Better Goods',
    category: 'Gummy', packSize: '200g', casePackQty: 18,
    shelfLifeDays: 540, minRemainingDaysAtDC: 180, unitCost: 20.4, retailPrice: 2.58, emoji: '🍋',
  },
];

export const SKU_BY_ID: Record<string, SKU> = Object.fromEntries(SKUS.map((s) => [s.id, s]));

/** Brand context summary used across pages. */
export const PILOT_BRAND = {
  retailerName: 'Walmart',
  importerName: 'Bespoke Foods',
  privateLabel: 'Better Goods',
  productLine: '8 SKUs · 6 chocolate bars + 2 gummies',
  sourcing: 'Eon (Greece) · Lavdas (Greece) · Swiss cocoa-mass supplier',
  poLeadWeeks: 10,
  oceanTransitDays: 15,
} as const;
